import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReactionDto {
  @IsString()
  @IsNotEmpty()
  answerId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  reactionId: string;

  @IsString()
  @IsOptional()
  gameId?: string;
}
