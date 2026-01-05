import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, type: String })
  name: string;

  // Telegram данные (опционально)
  @Prop({ type: Number })
  telegramId?: number;

  @Prop({ type: String })
  telegramUsername?: string;

  @Prop({ type: String })
  telegramFirstName?: string;

  @Prop({ type: String })
  telegramLastName?: string;

  @Prop({ type: String })
  telegramPhotoUrl?: string;

  @Prop({ type: String })
  telegramLanguageCode?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

