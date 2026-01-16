import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Game, GameDocument } from './infrastructure/schemas/game.schema';
import { BankAssociationTextService } from './bank-association-text/bank-association-text.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel('Game') private gameModel: Model<GameDocument>,
    private bankAssociationTextService: BankAssociationTextService,
    private configService: ConfigService,
  ) {}

  /**
   * Получает следующий номер для новой игры (автоинкремент)
   * @returns следующий номер в виде строки
   */
  private async getNextGameNumber(): Promise<string> {
    // Получаем последнюю запись, отсортированную по полю number по убыванию
    const lastGame = await this.gameModel.findOne().sort({ number: -1 }).exec();

    // Если записей нет, возвращаем 1
    if (!lastGame || !lastGame.number) {
      return '1';
    }

    // Преобразуем number в число, увеличиваем на 1 и возвращаем как строку
    const lastNumber =
      typeof lastGame.number === 'string'
        ? parseInt(lastGame.number, 10)
        : lastGame.number;

    return (lastNumber + 1).toString();
  }

  /**
   * Создает новую игру
   * @param gameData - данные игры (typeGame, createdBy)
   * @param usedQuestionIds - массив уже использованных ID вопросов (опционально)
   * @returns созданная игра
   */
  async createGame(
    gameData: {
      typeGame: string;
      createdBy: string;
    },
    usedQuestionIds: string[] = [],
  ): Promise<GameDocument> {
    let question = '';
    let usedQuestions: string[] = [...usedQuestionIds];

    // Если тип игры - association-text, выбираем случайную запись из банка
    if (gameData.typeGame === 'association-text') {
      const randomQuestion =
        await this.getRandomAssociationText(usedQuestionIds);
      if (randomQuestion) {
        question = randomQuestion.question;
        usedQuestions.push(randomQuestion._id.toString());
      }
    }

    // Получаем максимальное количество раундов из ENV или используем значение по умолчанию
    const maxRounds = parseInt(
      this.configService.get<string>('DEFAULT_COUNT_RAUNDS') || '10',
      10,
    );

    // Получаем следующий номер для игры (автоинкремент)
    const nextNumber = await this.getNextGameNumber();

    const newGame = new this.gameModel({
      typeGame: gameData.typeGame,
      createdBy: gameData.createdBy,
      status: 'active',
      question,
      usedQuestions,
      currentRound: 1,
      maxRounds,
      number: nextNumber,
    });

    return newGame.save();
  }

  /**
   * Получает случайную запись из банка ассоциаций, исключая уже использованные
   * @param usedIds - массив уже использованных ID
   * @returns случайная запись или null, если все записи использованы
   */
  private async getRandomAssociationText(
    usedIds: string[] = [],
  ): Promise<{ _id: Types.ObjectId; question: string } | null> {
    // Получаем все записи из банка
    const allQuestions = await this.bankAssociationTextService.findAll();

    if (allQuestions.length === 0) {
      return null;
    }

    // Фильтруем записи, исключая уже использованные
    const availableQuestions = allQuestions.filter(
      (q) => !usedIds.includes(q._id.toString()),
    );

    if (availableQuestions.length === 0) {
      // Если все вопросы использованы, возвращаем null
      // В будущем можно реализовать логику сброса или циклического повторения
      return null;
    }

    // Выбираем случайную запись
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const randomQuestion = availableQuestions[randomIndex];

    return {
      _id: randomQuestion._id,
      question: randomQuestion.question,
    };
  }

  /**
   * Находит игру по ID
   */
  async findById(id: string): Promise<GameDocument | null> {
    return this.gameModel.findById(id).exec();
  }

  /**
   * Находит игры по типу
   */
  async findByType(typeGame: string): Promise<GameDocument[]> {
    return this.gameModel.find({ typeGame }).exec();
  }

  /**
   * Получает все игры
   */
  async findAll(): Promise<GameDocument[]> {
    return this.gameModel.find().exec();
  }

  /**
   * Получает количество активных игр по типу
   * (игры со статусом waiting или active)
   */
  async getActiveGamesCountByType(typeGame: string): Promise<number> {
    return this.gameModel
      .countDocuments({
        typeGame,
        status: { $in: ['waiting', 'active'] },
      })
      .exec();
  }

  /**
   * Находит все активные игры пользователя
   * (игры со статусом != 'disabled')
   */
  async findActiveGamesByUser(userId: string): Promise<GameDocument[]> {
    return this.gameModel
      .find({
        createdBy: userId as any,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 }) // Сортируем по дате создания (новые первыми)
      .exec();
  }

  /**
   * Находит активную игру пользователя по типу
   * Если игра не найдена (status != 'disabled'), создает новую
   */
  async findOrCreateGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<GameDocument> {
    // Ищем активную игру пользователя по типу
    const existingGame = await this.gameModel
      .findOne({
        createdBy: userId as any,
        typeGame,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 }) // Берем самую новую игру
      .exec();

    // Если игра найдена, возвращаем ее
    if (existingGame) {
      return existingGame;
    }

    // Если игра не найдена, создаем новую
    // Передаем пустой массив usedQuestions, так как это новая игра
    return this.createGame(
      {
        typeGame,
        createdBy: userId,
      },
      [],
    );
  }

  /**
   * Обновляет вопрос в игре и добавляет ID в usedQuestions
   */
  async updateQuestion(gameId: string): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    // Если тип игры - association-text, выбираем новый вопрос
    if (game.typeGame === 'association-text') {
      const randomQuestion = await this.getRandomAssociationText(
        game.usedQuestions,
      );
      if (randomQuestion) {
        game.question = randomQuestion.question;
        game.usedQuestions.push(randomQuestion._id.toString());
        return game.save();
      }
    }

    return game;
  }

  /**
   * Увеличивает текущий раунд игры
   */
  async incrementRound(gameId: string): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    game.currentRound = (game.currentRound || 1) + 1;
    return game.save();
  }

  /**
   * Увеличивает счетчик завершенных игр (циклов раундов)
   */
  async incrementGamesCount(gameId: string): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    game.gamesCount = (game.gamesCount || 0) + 1;
    return game.save();
  }

  /**
   * Обновляет статистику игры, суммируя новые очки с уже существующими
   * @param gameId - ID игры
   * @param userScores - объект с очками пользователей за текущий раунд { userId: score }
   * @returns обновленная игра
   */
  async updateStats(
    gameId: string,
    userScores: Record<string, number>,
  ): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    // Инициализируем stats, если его нет
    if (!game.stats) {
      game.stats = new Map<string, number>();
    }

    // Суммируем новые очки с уже существующими
    Object.entries(userScores).forEach(([userId, score]) => {
      const currentScore = game.stats.get(userId) || 0;
      game.stats.set(userId, currentScore + score);
    });

    return game.save();
  }

  /**
   * Сохраняет статистику игры и завершает её
   * @param gameId - ID игры
   * @param userScores - объект с очками пользователей { userId: score }
   * @returns обновленная игра
   */
  async finishGame(
    gameId: string,
    userScores: Record<string, number>,
  ): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    // Сохраняем статистику (очки по пользователям)
    const statsMap = new Map<string, number>();
    Object.entries(userScores).forEach(([userId, score]) => {
      statsMap.set(userId, score);
    });
    game.stats = statsMap;

    // Выставляем статус 'finish'
    game.status = 'finish';

    return game.save();
  }

  /**
   * Добавляет пользователя в массив users игры, если его там еще нет
   */
  async addUserToGame(
    gameId: string,
    userId: string,
  ): Promise<GameDocument | null> {
    const game = await this.findById(gameId);
    if (!game) {
      return null;
    }

    // Проверяем, не находится ли пользователь в черном списке
    const isBlacklisted = game.blackListUsers.some(
      (id) => id.toString() === userId,
    );
    if (isBlacklisted) {
      return game; // Не добавляем пользователя из черного списка
    }

    // Проверяем, не добавлен ли пользователь уже в массив users
    const userExists = game.users.some((id) => id.toString() === userId);
    if (!userExists) {
      game.users.push(userId as any);
      return game.save();
    }

    return game;
  }

  /**
   * Находит все активные игры, где пользователь является участником (в массиве users)
   */
  async findActiveGamesByParticipant(userId: string): Promise<GameDocument[]> {
    return this.gameModel
      .find({
        users: userId as any,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 }) // Сортируем по дате создания (новые первыми)
      .exec();
  }

  /**
   * Проверяет существование активной игры по invite-коду (формат: userId/game/typeGame)
   * Возвращает игру, если она существует и активна
   */
  async findActiveGameByInvite(
    inviteUserId: string,
    typeGame: string,
  ): Promise<GameDocument | null> {
    return this.gameModel
      .findOne({
        createdBy: inviteUserId as any,
        typeGame,
        status: { $nin: ['disabled', 'finish'] },
      })
      .sort({ createdAt: -1 }) // Берем самую новую игру
      .exec();
  }
}
