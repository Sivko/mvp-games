import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnswerDocument } from '../schemas/answer.schema';
import { GameDocument } from '../../../games/infrastructure/schemas/game.schema';
import { IAnswerRepository } from '../../domain/repositories/answer.repository.interface';
import { Answer } from '../../domain/entities/answer.entity';

@Injectable()
export class MongooseAnswerRepository implements IAnswerRepository {
  constructor(
    @InjectModel('Answer') private answerModel: Model<AnswerDocument>,
    @InjectModel('Game') private gameModel: Model<GameDocument>,
  ) {}

  async findById(id: string): Promise<Answer | null> {
    const doc = await this.answerModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findByGameId(gameId: string): Promise<Answer[]> {
    const docs = await this.answerModel.find({ gameId: gameId as any }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByGameIdAndUserId(
    gameId: string,
    userId: string,
  ): Promise<Answer | null> {
    const doc = await this.answerModel
      .findOne({
        gameId: gameId as any,
        user: userId as any,
      })
      .exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findByQuestion(
    question: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }> {
    const matchingGames = await this.gameModel
      .find({ question })
      .select('_id')
      .exec();

    const matchingGameIds = matchingGames.map((game) => game._id);

    const skip = (page - 1) * limit;

    const query: any = {
      $or: [
        ...(matchingGameIds.length > 0
          ? [{ gameId: { $in: matchingGameIds as any } }]
          : []),
        { gameId: { $exists: false } },
        { gameId: null },
      ],
    };

    const docs = await this.answerModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    const total = await this.answerModel.countDocuments(query).exec();

    return {
      answers: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findByQuestionExcludingGame(
    question: string,
    excludeGameId: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }> {
    const matchingGames = await this.gameModel
      .find({
        question,
        _id: { $ne: excludeGameId },
      })
      .select('_id')
      .exec();

    const matchingGameIds = matchingGames.map((game) => game._id);

    if (matchingGameIds.length === 0) {
      return { answers: [], total: 0 };
    }

    const skip = (page - 1) * limit;

    const docs = await this.answerModel
      .find({ gameId: { $in: matchingGameIds as any } })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.answerModel
      .countDocuments({ gameId: { $in: matchingGameIds as any } })
      .exec();

    return {
      answers: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findByBankAssociationTextId(
    bankAssociationTextId: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }> {
    const skip = (page - 1) * limit;

    const docs = await this.answerModel
      .find({ bankAssociationTextId: bankAssociationTextId as any })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.answerModel
      .countDocuments({ bankAssociationTextId: bankAssociationTextId as any })
      .exec();

    return {
      answers: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(answer: Answer): Promise<Answer> {
    const answerData: any = {
      text: answer.text,
      similarity: answer.similarity,
      score: answer.score,
      stats: answer.stats.toObject(),
    };

    if (answer.gameId) {
      answerData.gameId = answer.gameId as any;
    }
    if (answer.userId) {
      answerData.user = answer.userId as any;
    }
    if (answer.bankAssociationTextId) {
      answerData.bankAssociationTextId = answer.bankAssociationTextId as any;
    }

    if (answer.id) {
      const updated = await this.answerModel
        .findByIdAndUpdate(answer.id, answerData, { new: true })
        .exec();
      if (!updated) {
        throw new Error(`Answer with ID ${answer.id} not found`);
      }
      return this.toDomain(updated);
    } else {
      const created = new this.answerModel(answerData);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async delete(id: string): Promise<void> {
    await this.answerModel.findByIdAndDelete(id).exec();
  }

  private toDomain(doc: AnswerDocument): Answer {
    return Answer.reconstitute(
      doc._id.toString(),
      doc.gameId?.toString() || null,
      doc.user?.toString() || null,
      doc.text,
      doc.similarity || 0,
      doc.stats || { totalReactions: 0, uniqueUsersReacted: 0 },
      doc.score || 0,
      doc.bankAssociationTextId?.toString() || null,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
