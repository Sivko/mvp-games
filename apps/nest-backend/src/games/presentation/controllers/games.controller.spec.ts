import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GameApplicationService } from '../../application/services/game.application.service';
import { CreateGameDto } from '../../application/dto/create-game.dto';
import { GameResponseDto } from '../../application/dto/game-response.dto';

describe('GamesController', () => {
  let controller: GamesController;
  let applicationService: jest.Mocked<GameApplicationService>;

  beforeEach(async () => {
    const mockApplicationService: jest.Mocked<GameApplicationService> = {
      createGame: jest.fn(),
      findById: jest.fn(),
      findActiveGamesByUser: jest.fn(),
      findOrCreateGameByUserAndType: jest.fn(),
      findActiveGamesByParticipant: jest.fn(),
      findActiveGameByInvite: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GameApplicationService,
          useValue: mockApplicationService,
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
    applicationService = module.get<GameApplicationService>(
      GameApplicationService,
    ) as jest.Mocked<GameApplicationService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGame', () => {
    it('should create a game', async () => {
      const createGameDto: CreateGameDto = {
        typeGame: 'association-text',
        createdBy: 'user1',
      };

      const mockResponse: GameResponseDto = {
        _id: 'game-id',
        typeGame: 'association-text',
        createdBy: 'user1',
        status: 'active',
        gamesCount: 0,
        question: '',
        usedQuestions: [],
        number: '1',
      };

      applicationService.createGame.mockResolvedValue(mockResponse);

      const result = await controller.createGame(createGameDto);

      expect(result).toEqual(mockResponse);
      expect(applicationService.createGame).toHaveBeenCalledWith(createGameDto);
    });
  });

  describe('getGameById', () => {
    it('should return game by id', async () => {
      const mockResponse: GameResponseDto = {
        _id: 'game-id',
        typeGame: 'association-text',
        createdBy: 'user1',
        status: 'active',
        gamesCount: 0,
        question: '',
        usedQuestions: [],
        number: '1',
      };

      applicationService.findById.mockResolvedValue(mockResponse);

      const result = await controller.getGameById('game-id');

      expect(result).toEqual(mockResponse);
      expect(applicationService.findById).toHaveBeenCalledWith('game-id');
    });
  });

  describe('getActiveGamesByUser', () => {
    it('should return active games for user', async () => {
      const mockResponse: GameResponseDto[] = [
        {
          _id: 'game-id',
          typeGame: 'association-text',
          createdBy: 'user1',
          status: 'active',
          gamesCount: 0,
          question: '',
          usedQuestions: [],
          number: '1',
        },
      ];

      applicationService.findActiveGamesByUser.mockResolvedValue(mockResponse);

      const result = await controller.getActiveGamesByUser('user1');

      expect(result).toEqual(mockResponse);
      expect(applicationService.findActiveGamesByUser).toHaveBeenCalledWith(
        'user1',
      );
    });
  });
});
