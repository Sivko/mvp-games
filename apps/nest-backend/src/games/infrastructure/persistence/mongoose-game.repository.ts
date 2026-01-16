import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameDocument } from '../../infrastructure/schemas/game.schema';
import { IGameRepository } from '../../domain/repositories/game.repository.interface';
import { Game } from '../../domain/entities/game.entity';

@Injectable()
export class MongooseGameRepository implements IGameRepository {
  constructor(@InjectModel('Game') private gameModel: Model<GameDocument>) {}

  async findById(id: string): Promise<Game | null> {
    const doc = await this.gameModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findByType(typeGame: string): Promise<Game[]> {
    const docs = await this.gameModel.find({ typeGame }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(): Promise<Game[]> {
    const docs = await this.gameModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async getActiveGamesCountByType(typeGame: string): Promise<number> {
    return this.gameModel
      .countDocuments({
        typeGame,
        status: { $in: ['waiting', 'active'] },
      })
      .exec();
  }

  async findActiveGamesByUser(userId: string): Promise<Game[]> {
    const docs = await this.gameModel
      .find({
        createdBy: userId as any,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findOrCreateGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<Game> {
    const existingDoc = await this.gameModel
      .findOne({
        createdBy: userId as any,
        typeGame,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (existingDoc) {
      return this.toDomain(existingDoc);
    }

    // Return null to indicate game not found - application service will create it
    throw new Error('Game not found');
  }

  async findActiveGamesByParticipant(userId: string): Promise<Game[]> {
    const docs = await this.gameModel
      .find({
        users: userId as any,
        status: { $ne: 'disabled' },
      })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findActiveGameByInvite(
    inviteUserId: string,
    typeGame: string,
  ): Promise<Game | null> {
    const doc = await this.gameModel
      .findOne({
        createdBy: inviteUserId as any,
        typeGame,
        status: { $nin: ['disabled', 'finish'] },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async save(game: Game): Promise<Game> {
    const statsMap = new Map<string, number>();
    game.stats.getAllScores().forEach((score, userId) => {
      statsMap.set(userId, score);
    });

    const gameData = {
      number: game.number,
      status: game.status.getValue(),
      typeGame: game.typeGame.getValue(),
      createdBy: game.createdBy as any,
      question: game.question,
      usedQuestions: game.usedQuestions,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      gamesCount: game.gamesCount,
      users: game.users.map((u) => u as any),
      blackListUsers: game.blackListUsers.map((u) => u as any),
      stats: statsMap,
    };

    if (game.id) {
      const updated = await this.gameModel
        .findByIdAndUpdate(game.id, gameData, { new: true })
        .exec();
      if (!updated) {
        throw new Error(`Game with ID ${game.id} not found`);
      }
      return this.toDomain(updated);
    } else {
      const created = new this.gameModel(gameData);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async getNextGameNumber(): Promise<string> {
    const lastGame = await this.gameModel.findOne().sort({ number: -1 }).exec();

    if (!lastGame || !lastGame.number) {
      return '1';
    }

    const lastNumber =
      typeof lastGame.number === 'string'
        ? parseInt(lastGame.number, 10)
        : lastGame.number;

    return (lastNumber + 1).toString();
  }

  private toDomain(doc: GameDocument): Game {
    const statsMap = new Map<string, number>();
    if (doc.stats) {
      doc.stats.forEach((value, key) => {
        statsMap.set(key, value);
      });
    }

    return Game.reconstitute(
      doc._id.toString(),
      doc.number?.toString() || '1',
      doc.status || 'active',
      doc.typeGame,
      doc.createdBy.toString(),
      doc.question || '',
      doc.usedQuestions || [],
      doc.currentRound || 1,
      doc.maxRounds || 10,
      doc.gamesCount || 0,
      doc.users?.map((u) => u.toString()) || [],
      doc.blackListUsers?.map((u) => u.toString()) || [],
      statsMap,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
