import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateAnswerDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsNumber()
  @IsOptional()
  score?: number;
}
