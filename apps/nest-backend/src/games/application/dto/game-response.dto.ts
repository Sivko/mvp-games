export class GameResponseDto {
  _id: string;
  typeGame: string;
  createdBy: string;
  status: string;
  gamesCount: number;
  question: string;
  usedQuestions: string[];
  number: string;
  currentRound?: number;
  maxRounds?: number;
  users?: string[];
  stats?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}
