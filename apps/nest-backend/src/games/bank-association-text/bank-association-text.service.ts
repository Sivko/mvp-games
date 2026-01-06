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
}


