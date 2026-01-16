import { Answer } from '../entities/answer.entity';

export interface IAnswerRepository {
  findById(id: string): Promise<Answer | null>;
  findByGameId(gameId: string): Promise<Answer[]>;
  findByGameIdAndUserId(gameId: string, userId: string): Promise<Answer | null>;
  findByQuestion(
    question: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }>;
  findByQuestionExcludingGame(
    question: string,
    excludeGameId: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }>;
  findByBankAssociationTextId(
    bankAssociationTextId: string,
    page: number,
    limit: number,
  ): Promise<{ answers: Answer[]; total: number }>;
  save(answer: Answer): Promise<Answer>;
  delete(id: string): Promise<void>;
  deleteByGameId(gameId: string): Promise<void>;
  deleteByBankAssociationTextId(
    bankAssociationTextId: string,
  ): Promise<{ deletedCount: number }>;
  deleteAllWithBankAssociationTextId(): Promise<{ deletedCount: number }>;
}
