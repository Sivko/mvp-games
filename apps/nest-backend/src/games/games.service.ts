import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './game.schema';
import { BankAssociationTextService } from './bank-association-text/bank-association-text.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private bankAssociationTextService: BankAssociationTextService,
  ) {}

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
      const randomQuestion = await this.getRandomAssociationText(usedQuestionIds);
      if (randomQuestion) {
        question = randomQuestion.question;
        usedQuestions.push(randomQuestion._id.toString());
      }
    }

    const newGame = new this.gameModel({
      typeGame: gameData.typeGame,
      createdBy: gameData.createdBy,
      status: 'active',
      question,
      usedQuestions,
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
}

