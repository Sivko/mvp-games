import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FinishGameDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  userScores: Record<string, number>;
}
