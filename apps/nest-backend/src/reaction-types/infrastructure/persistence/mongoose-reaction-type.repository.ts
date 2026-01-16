import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReactionTypeDocument } from '../schemas/reaction-types.schema';
import { IReactionTypeRepository } from '../../domain/repositories/reaction-type.repository.interface';
import { ReactionType } from '../../domain/entities/reaction-type.entity';

@Injectable()
export class MongooseReactionTypeRepository implements IReactionTypeRepository {
  constructor(
    @InjectModel('ReactionType')
    private reactionTypeModel: Model<ReactionTypeDocument>,
  ) {}

  async findById(id: string): Promise<ReactionType | null> {
    const doc = await this.reactionTypeModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findAll(): Promise<ReactionType[]> {
    const docs = await this.reactionTypeModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(reactionType: ReactionType): Promise<ReactionType> {
    const data: any = {
      name: reactionType.name,
      image: reactionType.image,
      textFromFinalRound: reactionType.textFromFinalRound,
    };

    if (reactionType.id) {
      const updated = await this.reactionTypeModel
        .findByIdAndUpdate(reactionType.id, data, { new: true })
        .exec();
      if (!updated) {
        throw new Error(`ReactionType with ID ${reactionType.id} not found`);
      }
      return this.toDomain(updated);
    } else {
      const created = new this.reactionTypeModel(data);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async delete(id: string): Promise<void> {
    await this.reactionTypeModel.findByIdAndDelete(id).exec();
  }

  private toDomain(doc: ReactionTypeDocument): ReactionType {
    return ReactionType.reconstitute(
      doc._id.toString(),
      doc.name,
      doc.image || null,
      doc.textFromFinalRound || null,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
