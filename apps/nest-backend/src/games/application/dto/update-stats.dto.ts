import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStatsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  userScores: Record<string, number>;
}
