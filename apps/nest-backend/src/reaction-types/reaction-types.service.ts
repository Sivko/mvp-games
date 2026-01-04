import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReactionType, ReactionTypeDocument } from './schemas/reaction-types.schema';

@Injectable()
export class ReactionTypesService implements OnModuleInit {
  constructor(
    @InjectModel(ReactionType.name) private reactionTypeModel: Model<ReactionTypeDocument>,
  ) {}

  async onModuleInit() {
    // Инициализация дефолтных значений
    await this.initializeDefaultReactions();
  }

  private async initializeDefaultReactions() {
    const defaultReactions: Partial<ReactionType>[] = [
      {
        name: 'смешно',
        image: null,
        weight: 1,
      },
      {
        name: 'мило',
        image: null,
        weight: 1,
      },
    ];

    for (const reaction of defaultReactions) {
      const existing = await this.reactionTypeModel.findOne({ name: reaction.name }).exec();
      if (!existing) {
        await this.reactionTypeModel.create(reaction as any);
      }
    }
  }

  async findAll(): Promise<ReactionTypeDocument[]> {
    return this.reactionTypeModel.find().exec();
  }

  async findOne(id: string): Promise<ReactionTypeDocument | null> {
    return this.reactionTypeModel.findById(id).exec();
  }
}

