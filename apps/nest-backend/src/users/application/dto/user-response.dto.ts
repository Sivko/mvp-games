export class UserResponseDto {
  _id: string;
  name: string;
  telegramId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramPhotoUrl?: string;
  telegramLanguageCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
