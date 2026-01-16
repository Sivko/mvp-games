import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReactionDocument = Reaction & Document;

@Schema({ timestamps: true })
export class Reaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Answer',
    required: true,
  })
  answerId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ReactionType',
    required: true,
  })
  reactionId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Game',
    required: false,
  })
  gameId?: MongooseSchema.Types.ObjectId;

  // createdAt автоматически добавляется через timestamps: true
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
