import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerQueryDto {
  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  excludeGameId?: string;

  @IsString()
  @IsOptional()
  bankAssociationTextId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
