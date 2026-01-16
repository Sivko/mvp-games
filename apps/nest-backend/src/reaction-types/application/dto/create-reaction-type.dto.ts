import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReactionTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  image?: string | null;

  @IsString()
  @IsOptional()
  textFromFinalRound?: string | null;
}
