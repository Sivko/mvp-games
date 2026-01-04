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
        _id: 1,
        name: 'смешно',
        image: null,
        weight: 1,
      },
      {
        _id: 2,
        name: 'мило',
        image: null,
        weight: 1,
      },
    ];

    for (const reaction of defaultReactions) {
      const existing = await this.reactionTypeModel.findOne({ _id: reaction._id } as any).exec();
      if (!existing) {
        await this.reactionTypeModel.create(reaction as any);
      }
    }
  }

  async findAll(): Promise<ReactionTypeDocument[]> {
    return this.reactionTypeModel.find().exec();
  }

  async findOne(id: number): Promise<ReactionTypeDocument | null> {
    return this.reactionTypeModel.findOne({ _id: id } as any).exec();
  }
}

