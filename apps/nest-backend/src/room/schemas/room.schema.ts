import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RoomDocument = Room & Document;

export interface LinkingWord {
  similarity: number;
  user: any;
}

const LinkingWordSchema = new MongooseSchema({
  similarity: { type: Number, required: true },
  user: { type: MongooseSchema.Types.Mixed, required: true },
}, { _id: false });

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true, type: Number })
  roomNumber: number;

  @Prop({
    type: Map,
    of: LinkingWordSchema,
    default: new Map(),
  })
  linkingWords: Map<string, LinkingWord>;

  @Prop({ type: String, default: 'waiting' })
  status: string;

  @Prop({ type: Number, default: 0 })
  gamesCount: number;

  @Prop({ type: String, required: true })
  sourceWord: string;

  @Prop({
    type: {
      user: { type: MongooseSchema.Types.Mixed, required: true },
    },
    required: true,
  })
  created: {
    user: any;
  };

  @Prop({ type: [String], default: [] })
  blackListWord: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
