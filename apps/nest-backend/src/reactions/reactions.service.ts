import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './schemas/reaction.schema';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>,
  ) {}

  async create(createDto: {
    answerId: string;
    userId: string;
    reactionId: string;
    gameId?: string;
  }): Promise<ReactionDocument> {
    const reactionData: any = {
      answerId: new Types.ObjectId(createDto.answerId),
      userId: new Types.ObjectId(createDto.userId),
      reactionId: new Types.ObjectId(createDto.reactionId),
    };
    
    if (createDto.gameId) {
      reactionData.gameId = new Types.ObjectId(createDto.gameId);
    }
    
    const created = new this.reactionModel(reactionData);
    return created.save();
  }

  async findAll(): Promise<ReactionDocument[]> {
    return this.reactionModel.find().exec();
  }

  async findById(id: string): Promise<ReactionDocument | null> {
    return this.reactionModel.findById(id).exec();
  }

  async findByAnswerId(answerId: string): Promise<ReactionDocument[]> {
    return this.reactionModel
      .find({ answerId: answerId as any })
      .exec();
  }

  async findByUserId(userId: string): Promise<ReactionDocument[]> {
    return this.reactionModel
      .find({ userId: userId as any })
      .exec();
  }

  async findByAnswerAndUser(
    answerId: string,
    userId: string,
  ): Promise<ReactionDocument[]> {
    return this.reactionModel
      .find({
        answerId: answerId as any,
        userId: userId as any,
      })
      .exec();
  }

  async delete(id: string): Promise<ReactionDocument | null> {
    return this.reactionModel.findByIdAndDelete(id).exec();
  }

  async deleteByAnswerAndUserAndReaction(
    answerId: string,
    userId: string,
    reactionId: string,
  ): Promise<ReactionDocument | null> {
    return this.reactionModel
      .findOneAndDelete({
        answerId: answerId as any,
        userId: userId as any,
        reactionId: reactionId as any,
      })
      .exec();
  }
}

