import { Game } from '../entities/game.entity';

export interface IGameRepository {
  findById(id: string): Promise<Game | null>;
  findByType(typeGame: string): Promise<Game[]>;
  findAll(): Promise<Game[]>;
  getActiveGamesCountByType(typeGame: string): Promise<number>;
  findActiveGamesByUser(userId: string): Promise<Game[]>;
  findOrCreateGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<Game>;
  findActiveGamesByParticipant(userId: string): Promise<Game[]>;
  findActiveGameByInvite(
    inviteUserId: string,
    typeGame: string,
  ): Promise<Game | null>;
  save(game: Game): Promise<Game>;
  getNextGameNumber(): Promise<string>;
}
