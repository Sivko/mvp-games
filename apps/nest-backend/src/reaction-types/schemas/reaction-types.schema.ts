import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReactionTypeDocument = ReactionType & Document;

@Schema({ timestamps: true })
export class ReactionType {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String, default: null })
  image: string | null;

  @Prop({ required: true, type: Number })
  weight: number;
}

export const ReactionTypeSchema = SchemaFactory.createForClass(ReactionType);

