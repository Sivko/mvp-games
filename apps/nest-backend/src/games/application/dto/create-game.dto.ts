import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  typeGame: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
