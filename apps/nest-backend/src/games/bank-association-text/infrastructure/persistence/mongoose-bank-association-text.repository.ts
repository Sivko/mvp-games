import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAssociationTextDocument } from '../schemas/bank-association-text.schema';
import { IBankAssociationTextRepository } from '../../domain/repositories/bank-association-text.repository.interface';
import { BankAssociationText } from '../../domain/entities/bank-association-text.entity';

@Injectable()
export class MongooseBankAssociationTextRepository implements IBankAssociationTextRepository {
  constructor(
    @InjectModel('BankAssociationText')
    private bankAssociationTextModel: Model<BankAssociationTextDocument>,
  ) {}

  async findById(id: string): Promise<BankAssociationText | null> {
    const doc = await this.bankAssociationTextModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findAll(): Promise<BankAssociationText[]> {
    const docs = await this.bankAssociationTextModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(
    bankAssociationText: BankAssociationText,
  ): Promise<BankAssociationText> {
    const data: any = {
      question: bankAssociationText.question,
      status: bankAssociationText.status,
    };

    if (bankAssociationText.id) {
      const updated = await this.bankAssociationTextModel
        .findByIdAndUpdate(bankAssociationText.id, data, { new: true })
        .exec();
      if (!updated) {
        throw new Error(
          `BankAssociationText with ID ${bankAssociationText.id} not found`,
        );
      }
      return this.toDomain(updated);
    } else {
      const created = new this.bankAssociationTextModel(data);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  async delete(id: string): Promise<void> {
    await this.bankAssociationTextModel.findByIdAndDelete(id).exec();
  }

  async deleteAll(): Promise<number> {
    const result = await this.bankAssociationTextModel.deleteMany({}).exec();
    return result.deletedCount || 0;
  }

  private toDomain(doc: BankAssociationTextDocument): BankAssociationText {
    return BankAssociationText.reconstitute(
      doc._id.toString(),
      doc.question,
      doc.status,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
