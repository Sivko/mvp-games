import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateBankAssociationTextDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
