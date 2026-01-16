import { Reaction } from '../entities/reaction.entity';

export interface IReactionRepository {
  findById(id: string): Promise<Reaction | null>;
  findAll(): Promise<Reaction[]>;
  findByAnswerId(answerId: string): Promise<Reaction[]>;
  findByUserId(userId: string): Promise<Reaction[]>;
  findByGameId(gameId: string): Promise<Reaction[]>;
  findByAnswerAndUser(answerId: string, userId: string): Promise<Reaction[]>;
  save(reaction: Reaction): Promise<Reaction>;
  delete(id: string): Promise<void>;
  deleteByAnswerAndUserAndReaction(
    answerId: string,
    userId: string,
    reactionId: string,
  ): Promise<void>;
}
