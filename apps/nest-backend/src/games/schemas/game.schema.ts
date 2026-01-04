import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: String, default: 'waiting' })
  status: string;

  @Prop({ type: Number, default: 0 })
  gamesCount: number;

  @Prop({ type: String, default: '' })
  question: string;

  @Prop({ type: [Number], default: [] })
  usedQuestions: number[];

  @Prop({ required: true, type: String })
  typeGame: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Room',
    required: true,
  })
  roomId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: {
      user: { type: MongooseSchema.Types.Mixed, required: true },
    },
    required: true,
  })
  created: {
    user: any;
  };
}

export const GameSchema = SchemaFactory.createForClass(Game);

