import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {

  @Prop({ type: Number, default: 1 })
  number: number;

  // статус игры
  @Prop({ type: String, default: 'active' })
  status: string;

  // количество игр
  @Prop({ type: Number, default: 0 })
  gamesCount: number;

  // вопрос
  @Prop({ type: String, default: '' })
  question: string;

  // массив использованных вопросов (ID записей из банка)
  @Prop({ type: [String], default: [] })
  usedQuestions: string[];

  // тип игры
  @Prop({ required: true, type: String })
  typeGame: string;

  // создатель игры
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: MongooseSchema.Types.ObjectId;

  // массив пользователей в игре
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  users: MongooseSchema.Types.ObjectId[];

  // черный список пользователей
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  blackListUsers: MongooseSchema.Types.ObjectId[];

  // текущий раунд
  @Prop({ type: Number, default: 1 })
  currentRound: number;

  // максимальное количество раундов
  @Prop({ type: Number, default: 3 })
  maxRounds: number;

  // статистика игры: очки по пользователям
  @Prop({
    type: Map,
    of: Number,
    default: {},
  })
  stats: Map<string, number>; // Map<userId, totalScore> - итоговые очки пользователей за всю игру
}

export const GameSchema = SchemaFactory.createForClass(Game);

