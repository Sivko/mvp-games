import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AnswerDocument = Answer & Document;

@Schema({ timestamps: true })
export class Answer {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Game',
    required: true,
  })
  gameId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  user?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ type: Number, default: 0 })
  similarity: number;

  @Prop({
    type: {
      totalReactions: { type: Number, default: 0 },
      uniqueUsersReacted: { type: Number, default: 0 },
    },
    default: {
      totalReactions: 0,
      uniqueUsersReacted: 0,
    },
  })
  stats: {
    totalReactions: number;
    uniqueUsersReacted: number;
  };

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'BankAssociationText',
    required: false,
  })
  bankAssociationTextId?: MongooseSchema.Types.ObjectId;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

