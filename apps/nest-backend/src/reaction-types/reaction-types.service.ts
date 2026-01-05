import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReactionType, ReactionTypeDocument } from './schemas/reaction-types.schema';

@Injectable()
export class ReactionTypesService {
  constructor(
    @InjectModel(ReactionType.name) private reactionTypeModel: Model<ReactionTypeDocument>,
  ) {}

  async findAll(): Promise<ReactionTypeDocument[]> {
    return this.reactionTypeModel.find().sort({ weight: 1 }).exec();
  }

  async findOne(id: string): Promise<ReactionTypeDocument | null> {
    return this.reactionTypeModel.findById(id).exec();
  }

  async create(data: { name: string; image?: string | null; weight: number }): Promise<ReactionTypeDocument> {
    const created = new this.reactionTypeModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<{ name: string; image: string | null; weight: number }>): Promise<ReactionTypeDocument | null> {
    return this.reactionTypeModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<ReactionTypeDocument | null> {
    return this.reactionTypeModel.findByIdAndDelete(id).exec();
  }
}

