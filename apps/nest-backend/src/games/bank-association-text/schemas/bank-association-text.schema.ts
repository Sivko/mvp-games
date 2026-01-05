import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BankAssociationTextDocument = BankAssociationText & Document;

const VariantSchema = new MongooseSchema({
  variant: { type: String, required: true },
  score: { type: Number, required: true },
}, { timestamps: true });

@Schema({ timestamps: true })
export class BankAssociationText {
  @Prop({ required: true, type: String })
  question: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({
    type: [VariantSchema],
    default: [],
  })
  variants: Array<{
    variant: string;
    score: number;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
}

export const BankAssociationTextSchema = SchemaFactory.createForClass(BankAssociationText);

