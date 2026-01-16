export class AnswerResponseDto {
  _id: string;
  gameId?: string;
  userId?: string;
  text: string;
  similarity: number;
  stats: {
    totalReactions: number;
    uniqueUsersReacted: number;
  };
  score: number;
  bankAssociationTextId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
