export class ReactionTypeResponseDto {
  _id: string;
  name: string;
  image: string | null;
  textFromFinalRound: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
