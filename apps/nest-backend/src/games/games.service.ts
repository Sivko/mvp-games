import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './game.schema';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
  ) {}

  /**
   * Создает новую игру
   * @param gameData - данные игры (typeGame, createdBy)
   * @returns созданная игра
   */
  async createGame(gameData: {
    typeGame: string;
    createdBy: string;
  }): Promise<GameDocument> {
    const newGame = new this.gameModel({
      typeGame: gameData.typeGame,
      createdBy: gameData.createdBy,
      status: 'active',
    });

    return newGame.save();
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
   * Находит активную игру пользователя по типу
   * (игра со статусом != 'disabled')
   */
  async findActiveGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<GameDocument | null> {
    return this.gameModel
      .findOne({
        createdBy: userId as any,
        typeGame,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 }) // Берем самую новую игру
      .exec();
  }
}

