import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { QuestionSelectorService } from '../../domain/services/question-selector.service';
import { Game } from '../../domain/entities/game.entity';
import { GameType } from '../../domain/value-objects/game-type.vo';
import { CreateGameDto } from '../dto/create-game.dto';
import { GameResponseDto } from '../dto/game-response.dto';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { FinishGameDto } from '../dto/finish-game.dto';

@Injectable()
export class GameApplicationService {
  constructor(
    @Inject('IGameRepository')
    private readonly gameRepository: IGameRepository,
    private readonly questionSelectorService: QuestionSelectorService,
    private readonly configService: ConfigService,
  ) {}

  async createGame(
    createGameDto: CreateGameDto,
    usedQuestionIds: string[] = [],
  ): Promise<GameResponseDto> {
    let question = '';
    let usedQuestions: string[] = [...usedQuestionIds];

    const gameType = GameType.create(createGameDto.typeGame);

    if (gameType.isAssociationText()) {
      const randomQuestion =
        await this.questionSelectorService.selectRandomQuestion(
          usedQuestionIds,
        );
      if (randomQuestion) {
        question = randomQuestion.question;
        usedQuestions.push(randomQuestion._id);
      }
    }

    const maxRounds = parseInt(
      this.configService.get<string>('DEFAULT_COUNT_RAUNDS') || '10',
      10,
    );

    const nextNumber = await this.gameRepository.getNextGameNumber();

    const game = Game.create(
      createGameDto.typeGame,
      createGameDto.createdBy,
      question,
      usedQuestions,
      maxRounds,
      nextNumber,
    );

    const savedGame = await this.gameRepository.save(game);

    return this.toResponseDto(savedGame);
  }

  async findById(id: string): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(id);
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return this.toResponseDto(game);
  }

  async findByType(typeGame: string): Promise<GameResponseDto[]> {
    const games = await this.gameRepository.findByType(typeGame);
    return games.map((game) => this.toResponseDto(game));
  }

  async findAll(): Promise<GameResponseDto[]> {
    const games = await this.gameRepository.findAll();
    return games.map((game) => this.toResponseDto(game));
  }

  async getActiveGamesCountByType(typeGame: string): Promise<number> {
    return this.gameRepository.getActiveGamesCountByType(typeGame);
  }

  async findActiveGamesByUser(userId: string): Promise<GameResponseDto[]> {
    const games = await this.gameRepository.findActiveGamesByUser(userId);
    return games.map((game) => this.toResponseDto(game));
  }

  async findOrCreateGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<GameResponseDto> {
    try {
      const game = await this.gameRepository.findOrCreateGameByUserAndType(
        userId,
        typeGame,
      );
      return this.toResponseDto(game);
    } catch (_error) {
      // If game not found, create a new one
      const createGameDto: CreateGameDto = {
        typeGame,
        createdBy: userId,
      };
      return this.createGame(createGameDto, []);
    }
  }

  async updateQuestion(gameId: string): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    const gameType = game.typeGame;
    if (gameType.isAssociationText()) {
      const randomQuestion =
        await this.questionSelectorService.selectRandomQuestion(
          game.usedQuestions,
        );
      if (randomQuestion) {
        game.updateQuestion(randomQuestion.question, randomQuestion._id);
        const savedGame = await this.gameRepository.save(game);
        return this.toResponseDto(savedGame);
      }
    }

    return this.toResponseDto(game);
  }

  async incrementRound(gameId: string): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    game.incrementRound();
    const savedGame = await this.gameRepository.save(game);
    return this.toResponseDto(savedGame);
  }

  async incrementGamesCount(gameId: string): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    game.incrementGamesCount();
    const savedGame = await this.gameRepository.save(game);
    return this.toResponseDto(savedGame);
  }

  async updateStats(
    gameId: string,
    updateStatsDto: UpdateStatsDto,
  ): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    game.updateStats(updateStatsDto.userScores);
    const savedGame = await this.gameRepository.save(game);
    return this.toResponseDto(savedGame);
  }

  async finishGame(
    gameId: string,
    finishGameDto: FinishGameDto,
  ): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    game.finishGame(finishGameDto.userScores);
    const savedGame = await this.gameRepository.save(game);
    return this.toResponseDto(savedGame);
  }

  async addUserToGame(
    gameId: string,
    userId: string,
  ): Promise<GameResponseDto> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    game.addUser(userId);
    const savedGame = await this.gameRepository.save(game);
    return this.toResponseDto(savedGame);
  }

  async findActiveGamesByParticipant(
    userId: string,
  ): Promise<GameResponseDto[]> {
    const games =
      await this.gameRepository.findActiveGamesByParticipant(userId);
    return games.map((game) => this.toResponseDto(game));
  }

  async findActiveGameByInvite(
    inviteUserId: string,
    typeGame: string,
  ): Promise<GameResponseDto> {
    const game = await this.gameRepository.findActiveGameByInvite(
      inviteUserId,
      typeGame,
    );
    if (!game) {
      throw new NotFoundException(
        `Active game not found for invite user ${inviteUserId} and type ${typeGame}`,
      );
    }
    return this.toResponseDto(game);
  }

  private toResponseDto(game: Game): GameResponseDto {
    return {
      _id: game.id || '',
      typeGame: game.typeGame.getValue(),
      createdBy: game.createdBy,
      status: game.status.getValue(),
      gamesCount: game.gamesCount,
      question: game.question,
      usedQuestions: game.usedQuestions,
      number: game.number,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      users: game.users,
      stats: game.stats.toRecord(),
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }
}
