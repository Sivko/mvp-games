import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ComplainAssociationTextDocument = ComplainAssociationText & Document;

@Schema({ timestamps: true })
export class ComplainAssociationText {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'BankAssociationText',
    required: false,
  })
  bankAssociationTextId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Answer',
    required: false,
  })
  answerId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ComplainAssociationTextSchema = SchemaFactory.createForClass(ComplainAssociationText);

