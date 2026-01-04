import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({
    type: [String],
    default: ['нос', 'машина'],
  })
  searchWords: string[];

  @Prop({
    type: [String],
    default: ['нос', 'машина'],
  })
  associationWords: string[];
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

