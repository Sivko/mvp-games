import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReactionDocument } from '../schemas/reaction.schema';
import { IReactionRepository } from '../../domain/repositories/reaction.repository.interface';
import { Reaction } from '../../domain/entities/reaction.entity';

@Injectable()
export class MongooseReactionRepository implements IReactionRepository {
  constructor(
    @InjectModel('Reaction') private reactionModel: Model<ReactionDocument>,
  ) {}

  async findById(id: string): Promise<Reaction | null> {
    const doc = await this.reactionModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findAll(): Promise<Reaction[]> {
    const docs = await this.reactionModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByAnswerId(answerId: string): Promise<Reaction[]> {
    const docs = await this.reactionModel
      .find({ answerId: answerId as any })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<Reaction[]> {
    const docs = await this.reactionModel
      .find({ userId: userId as any })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByGameId(gameId: string): Promise<Reaction[]> {
    const docs = await this.reactionModel
      .find({ gameId: gameId as any })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByAnswerAndUser(
    answerId: string,
    userId: string,
  ): Promise<Reaction[]> {
    const docs = await this.reactionModel
      .find({
        answerId: answerId as any,
        userId: userId as any,
      })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(reaction: Reaction): Promise<Reaction> {
    const reactionData: any = {
      answerId: reaction.answerId as any,
      userId: reaction.userId as any,
      reactionId: reaction.reactionId as any,
    };

    if (reaction.gameId) {
      reactionData.gameId = reaction.gameId as any;
    }

    if (reaction.id) {
      const updated = await this.reactionModel
        .findByIdAndUpdate(reaction.id, reactionData, { new: true })
        .exec();
      if (!updated) {
        throw new Error(`Reaction with ID ${reaction.id} not found`);
      }
      return this.toDomain(updated);
    } else {
      const created = new this.reactionModel(reactionData);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async delete(id: string): Promise<void> {
    await this.reactionModel.findByIdAndDelete(id).exec();
  }

  async deleteByAnswerAndUserAndReaction(
    answerId: string,
    userId: string,
    reactionId: string,
  ): Promise<void> {
    await this.reactionModel
      .findOneAndDelete({
        answerId: answerId as any,
        userId: userId as any,
        reactionId: reactionId as any,
      })
      .exec();
  }

  private toDomain(doc: ReactionDocument): Reaction {
    return Reaction.reconstitute(
      doc._id.toString(),
      doc.answerId.toString(),
      doc.userId.toString(),
      doc.reactionId.toString(),
      doc.gameId?.toString() || null,
      doc.createdAt,
    );
  }
}
