import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAssociationTextDocument } from '../../bank-association-text/infrastructure/schemas/bank-association-text.schema';
import {
  IBankAssociationTextRepository,
  BankAssociationTextData,
} from '../../domain/repositories/bank-association-text.repository.interface';

@Injectable()
export class MongooseBankAssociationTextRepository implements IBankAssociationTextRepository {
  constructor(
    @InjectModel('BankAssociationText')
    private bankAssociationTextModel: Model<BankAssociationTextDocument>,
  ) {}

  async findAll(): Promise<BankAssociationTextData[]> {
    const docs = await this.bankAssociationTextModel.find().exec();
    return docs.map((doc) => ({
      _id: doc._id.toString(),
      question: doc.question,
      status: doc.status,
    }));
  }

  async findById(id: string): Promise<BankAssociationTextData | null> {
    const doc = await this.bankAssociationTextModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return {
      _id: doc._id.toString(),
      question: doc.question,
      status: doc.status,
    };
  }
}
