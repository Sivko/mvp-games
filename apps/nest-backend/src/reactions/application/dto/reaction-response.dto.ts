export class ReactionResponseDto {
  _id: string;
  answerId: string;
  userId: string;
  reactionId: string;
  gameId?: string;
  createdAt?: Date;
}
