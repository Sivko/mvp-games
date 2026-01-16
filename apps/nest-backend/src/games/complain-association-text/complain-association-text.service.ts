import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ComplainAssociationText,
  ComplainAssociationTextDocument,
} from './schemas/complain-association-text.schema';

@Injectable()
export class ComplainAssociationTextService {
  constructor(
    @InjectModel(ComplainAssociationText.name)
    private complainAssociationTextModel: Model<ComplainAssociationTextDocument>,
  ) {}

  async create(
    createDto: Partial<ComplainAssociationText>,
  ): Promise<ComplainAssociationTextDocument> {
    const created = new this.complainAssociationTextModel(createDto);
    return created.save();
  }

  async findAll(): Promise<ComplainAssociationTextDocument[]> {
    return this.complainAssociationTextModel.find().exec();
  }

  async findById(id: string): Promise<ComplainAssociationTextDocument | null> {
    return this.complainAssociationTextModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: Partial<ComplainAssociationText>,
  ): Promise<ComplainAssociationTextDocument | null> {
    return this.complainAssociationTextModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ComplainAssociationTextDocument | null> {
    return this.complainAssociationTextModel.findByIdAndDelete(id).exec();
  }
}
