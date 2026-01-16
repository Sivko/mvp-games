import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BankAssociationTextDocument = BankAssociationText & Document & {
  createdAt?: Date;
  updatedAt?: Date;
};

@Schema({ timestamps: true })
export class BankAssociationText {
  @Prop({ required: true, type: String })
  question: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;
}

export const BankAssociationTextSchema =
  SchemaFactory.createForClass(BankAssociationText);
