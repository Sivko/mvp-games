import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Answer, AnswerDocument } from './schemas/answer.schema';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
  ) {}

  async create(createDto: {
    gameId: string;
    userId: string;
    text: string;
  }): Promise<AnswerDocument> {
    const created = new this.answerModel({
      gameId: createDto.gameId as any,
      user: createDto.userId as any,
      text: createDto.text,
    });
    return created.save();
  }

  async findByGameId(gameId: string): Promise<AnswerDocument[]> {
    return this.answerModel.find({ gameId: gameId as any }).exec();
  }

  async findByGameIdAndUserId(
    gameId: string,
    userId: string,
  ): Promise<AnswerDocument | null> {
    return this.answerModel
      .findOne({
        gameId: gameId as any,
        user: userId as any,
      })
      .exec();
  }

  async findById(id: string): Promise<AnswerDocument | null> {
    return this.answerModel.findById(id).exec();
  }

  async deleteByGameId(gameId: string): Promise<void> {
    await this.answerModel.deleteMany({ gameId: gameId as any }).exec();
  }
}

