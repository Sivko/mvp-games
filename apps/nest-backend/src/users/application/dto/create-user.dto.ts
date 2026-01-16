import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  telegramId?: number;

  @IsString()
  @IsOptional()
  telegramUsername?: string;

  @IsString()
  @IsOptional()
  telegramFirstName?: string;

  @IsString()
  @IsOptional()
  telegramLastName?: string;

  @IsString()
  @IsOptional()
  telegramPhotoUrl?: string;

  @IsString()
  @IsOptional()
  telegramLanguageCode?: string;
}
