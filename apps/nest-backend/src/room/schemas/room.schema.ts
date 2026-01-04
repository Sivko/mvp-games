import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { SearchWord, SearchWordSchema } from '../../games/search-word/search-word.schema';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true, type: Number })
  roomNumber: number;

  @Prop({
    type: SearchWordSchema,
    required: true,
  })
  searchWord: SearchWord;

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
