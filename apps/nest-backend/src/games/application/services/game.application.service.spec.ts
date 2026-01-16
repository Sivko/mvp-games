import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameApplicationService } from './game.application.service';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { QuestionSelectorService } from '../../domain/services/question-selector.service';
import { Game } from '../../domain/entities/game.entity';
import { CreateGameDto } from '../dto/create-game.dto';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { FinishGameDto } from '../dto/finish-game.dto';

describe('GameApplicationService', () => {
  let service: GameApplicationService;
  let gameRepository: jest.Mocked<IGameRepository>;
  let questionSelectorService: jest.Mocked<QuestionSelectorService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockGameRepository: jest.Mocked<IGameRepository> = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      getActiveGamesCountByType: jest.fn(),
      findActiveGamesByUser: jest.fn(),
      findOrCreateGameByUserAndType: jest.fn(),
      findActiveGamesByParticipant: jest.fn(),
      findActiveGameByInvite: jest.fn(),
      save: jest.fn(),
      getNextGameNumber: jest.fn(),
    };

    const mockQuestionSelectorService: jest.Mocked<QuestionSelectorService> = {
      selectRandomQuestion: jest.fn(),
    } as any;

    const mockConfigService: jest.Mocked<ConfigService> = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameApplicationService,
        {
          provide: 'IGameRepository',
          useValue: mockGameRepository,
        },
        {
          provide: QuestionSelectorService,
          useValue: mockQuestionSelectorService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GameApplicationService>(GameApplicationService);
    gameRepository = module.get(
      'IGameRepository',
    ) as jest.Mocked<IGameRepository>;
    questionSelectorService = module.get<QuestionSelectorService>(
      QuestionSelectorService,
    ) as jest.Mocked<QuestionSelectorService>;
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      const createGameDto: CreateGameDto = {
        typeGame: 'association-text',
        createdBy: 'user1',
      };

      gameRepository.getNextGameNumber.mockResolvedValue('1');
      questionSelectorService.selectRandomQuestion.mockResolvedValue({
        _id: 'q1',
        question: 'Test Question',
      });
      configService.get.mockReturnValue('10');

      const mockGame = Game.create(
        'association-text',
        'user1',
        'Test Question',
        ['q1'],
        10,
        '1',
      );
      // Clear events to avoid issues in tests
      mockGame.clearDomainEvents();
      gameRepository.save.mockResolvedValue(mockGame);

      const result = await service.createGame(createGameDto);

      expect(result.typeGame).toBe('association-text');
      expect(result.createdBy).toBe('user1');
      expect(result.question).toBe('Test Question');
      expect(gameRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return game by id', async () => {
      const mockGame = Game.create('association-text', 'user1');
      gameRepository.findById.mockResolvedValue(mockGame);

      const result = await service.findById('game-id');

      expect(result).toBeDefined();
      expect(gameRepository.findById).toHaveBeenCalledWith('game-id');
    });

    it('should throw NotFoundException when game not found', async () => {
      gameRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateQuestion', () => {
    it('should update question for association-text game', async () => {
      const mockGame = Game.create('association-text', 'user1');
      gameRepository.findById.mockResolvedValue(mockGame);
      questionSelectorService.selectRandomQuestion.mockResolvedValue({
        _id: 'q2',
        question: 'New Question',
      });
      gameRepository.save.mockResolvedValue(mockGame);

      await service.updateQuestion('game-id');

      expect(questionSelectorService.selectRandomQuestion).toHaveBeenCalled();
      expect(gameRepository.save).toHaveBeenCalled();
    });
  });

  describe('incrementRound', () => {
    it('should increment round', async () => {
      const mockGame = Game.create('association-text', 'user1', '', [], 10);
      gameRepository.findById.mockResolvedValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      await service.incrementRound('game-id');

      expect(gameRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when game not found', async () => {
      gameRepository.findById.mockResolvedValue(null);

      await expect(service.incrementRound('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStats', () => {
    it('should update game stats', async () => {
      const mockGame = Game.create('association-text', 'user1');
      gameRepository.findById.mockResolvedValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      const updateStatsDto: UpdateStatsDto = {
        userScores: { user1: 10, user2: 20 },
      };

      await service.updateStats('game-id', updateStatsDto);

      expect(gameRepository.save).toHaveBeenCalled();
    });
  });

  describe('finishGame', () => {
    it('should finish game', async () => {
      const mockGame = Game.create('association-text', 'user1');
      gameRepository.findById.mockResolvedValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      const finishGameDto: FinishGameDto = {
        userScores: { user1: 100 },
      };

      await service.finishGame('game-id', finishGameDto);

      expect(gameRepository.save).toHaveBeenCalled();
    });
  });

  describe('addUserToGame', () => {
    it('should add user to game', async () => {
      const mockGame = Game.create('association-text', 'user1');
      gameRepository.findById.mockResolvedValue(mockGame);
      gameRepository.save.mockResolvedValue(mockGame);

      await service.addUserToGame('game-id', 'user2');

      expect(gameRepository.save).toHaveBeenCalled();
    });

    it('should throw error for blacklisted user', async () => {
      const mockGame = Game.reconstitute(
        'id1',
        '1',
        'active',
        'association-text',
        'user1',
        '',
        [],
        1,
        10,
        0,
        [],
        ['user2'],
        new Map(),
      );
      gameRepository.findById.mockResolvedValue(mockGame);

      await expect(service.addUserToGame('game-id', 'user2')).rejects.toThrow();
    });
  });
});
