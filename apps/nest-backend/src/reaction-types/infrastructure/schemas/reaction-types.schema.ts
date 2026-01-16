import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReactionTypeDocument = ReactionType & Document & {
  createdAt?: Date;
  updatedAt?: Date;
};

@Schema({ timestamps: true })
export class ReactionType {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String, default: null })
  textFromFinalRound: string | null;

  @Prop({ type: String, default: null })
  image: string | null;
}

export const ReactionTypeSchema = SchemaFactory.createForClass(ReactionType);
