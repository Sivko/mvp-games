import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @IsOptional()
  gameId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  bankAssociationTextId?: string;
}
