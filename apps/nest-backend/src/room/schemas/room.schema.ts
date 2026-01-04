import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Game } from '../../games/schemas/game.schema';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true, type: Number })
  roomNumber: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Game',
    required: true,
  })
  game: MongooseSchema.Types.ObjectId;

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

export const RoomSchema = SchemaFactory.createForClass(Room);
