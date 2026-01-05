import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  // статус игры
  @Prop({ type: String, default: 'waiting' })
  status: string;

  // количество игр
  @Prop({ type: Number, default: 0 })
  gamesCount: number;

  // вопрос
  @Prop({ type: String, default: '' })
  question: string;

  // массив использованных вопросов
  @Prop({ type: [Number], default: [] })
  usedQuestions: number[];

  // тип игры
  @Prop({ required: true, type: String })
  typeGame: string;

  // id комнаты
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Room',
    required: true,
  })
  roomId: MongooseSchema.Types.ObjectId;

  // создатель игры
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const GameSchema = SchemaFactory.createForClass(Game);

