import { ReactionType } from '../entities/reaction-type.entity';

export interface IReactionTypeRepository {
  findById(id: string): Promise<ReactionType | null>;
  findAll(): Promise<ReactionType[]>;
  save(reactionType: ReactionType): Promise<ReactionType>;
  delete(id: string): Promise<void>;
}
