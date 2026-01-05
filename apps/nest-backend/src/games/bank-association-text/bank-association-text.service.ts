import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAssociationText, BankAssociationTextDocument } from './schemas/bank-association-text.schema';

@Injectable()
export class BankAssociationTextService {
  constructor(
    @InjectModel(BankAssociationText.name) 
    private bankAssociationTextModel: Model<BankAssociationTextDocument>,
  ) {}

  async create(createDto: Partial<BankAssociationText>): Promise<BankAssociationTextDocument> {
    const created = new this.bankAssociationTextModel(createDto);
    return created.save();
  }

  async findAll(): Promise<BankAssociationTextDocument[]> {
    return this.bankAssociationTextModel.find().exec();
  }

  async findById(id: string): Promise<BankAssociationTextDocument | null> {
    return this.bankAssociationTextModel.findById(id).exec();
  }

  async update(id: string, updateDto: Partial<BankAssociationText>): Promise<BankAssociationTextDocument | null> {
    return this.bankAssociationTextModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<BankAssociationTextDocument | null> {
    return this.bankAssociationTextModel.findByIdAndDelete(id).exec();
  }

  async addVariant(id: string, variant: { variant: string; score: number }): Promise<BankAssociationTextDocument | null> {
    return this.bankAssociationTextModel
      .findByIdAndUpdate(
        id,
        { $push: { variants: variant } },
        { new: true }
      )
      .exec();
  }

  async removeVariant(id: string, variantId: string): Promise<BankAssociationTextDocument | null> {
    return this.bankAssociationTextModel
      .findByIdAndUpdate(
        id,
        { $pull: { variants: { _id: variantId } } },
        { new: true }
      )
      .exec();
  }

  async updateVariant(id: string, variantId: string, variant: { variant?: string; score?: number }): Promise<BankAssociationTextDocument | null> {
    const updateFields: any = {};
    if (variant.variant !== undefined) {
      updateFields['variants.$.variant'] = variant.variant;
    }
    if (variant.score !== undefined) {
      updateFields['variants.$.score'] = variant.score;
    }

    return this.bankAssociationTextModel
      .findOneAndUpdate(
        { _id: id, 'variants._id': variantId },
        { $set: updateFields },
        { new: true }
      )
      .exec();
  }
}

