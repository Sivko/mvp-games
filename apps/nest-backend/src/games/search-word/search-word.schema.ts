import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export interface LinkingWord {
  similarity: number;
  user: any;
}

const LinkingWordSchema = new MongooseSchema({
  similarity: { type: Number, required: true },
  user: { type: MongooseSchema.Types.Mixed, required: true },
}, { _id: false });

@Schema({ _id: false })
export class SearchWord {
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

  @Prop({ type: String, default: '' })
  sourceWord: string;

  @Prop({ type: [String], default: [] })
  blackListWord: string[];
}

export const SearchWordSchema = SchemaFactory.createForClass(SearchWord);

