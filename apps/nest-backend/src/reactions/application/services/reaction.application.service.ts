import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IReactionRepository } from '../../domain/repositories/reaction.repository.interface';
import { Reaction } from '../../domain/entities/reaction.entity';
import { CreateReactionDto } from '../dto/create-reaction.dto';
import { ReactionResponseDto } from '../dto/reaction-response.dto';

@Injectable()
export class ReactionApplicationService {
  constructor(
    @Inject('IReactionRepository')
    private readonly reactionRepository: IReactionRepository,
  ) {}

  async create(
    createReactionDto: CreateReactionDto,
  ): Promise<ReactionResponseDto> {
    const reaction = Reaction.create(
      createReactionDto.answerId,
      createReactionDto.userId,
      createReactionDto.reactionId,
      createReactionDto.gameId,
    );
    const saved = await this.reactionRepository.save(reaction);
    return this.toResponseDto(saved);
  }

  async findById(id: string): Promise<ReactionResponseDto> {
    const reaction = await this.reactionRepository.findById(id);
    if (!reaction) {
      throw new NotFoundException(`Reaction with ID ${id} not found`);
    }
    return this.toResponseDto(reaction);
  }

  async findAll(): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findAll();
    return reactions.map((reaction) => this.toResponseDto(reaction));
  }

  async findByAnswerId(answerId: string): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findByAnswerId(answerId);
    return reactions.map((reaction) => this.toResponseDto(reaction));
  }

  async findByUserId(userId: string): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findByUserId(userId);
    return reactions.map((reaction) => this.toResponseDto(reaction));
  }

  async findByGameId(gameId: string): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findByGameId(gameId);
    return reactions.map((reaction) => this.toResponseDto(reaction));
  }

  async findByAnswerAndUser(
    answerId: string,
    userId: string,
  ): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findByAnswerAndUser(
      answerId,
      userId,
    );
    return reactions.map((reaction) => this.toResponseDto(reaction));
  }

  async delete(id: string): Promise<void> {
    await this.reactionRepository.delete(id);
  }

  async deleteByAnswerAndUserAndReaction(
    answerId: string,
    userId: string,
    reactionId: string,
  ): Promise<void> {
    await this.reactionRepository.deleteByAnswerAndUserAndReaction(
      answerId,
      userId,
      reactionId,
    );
  }

  private toResponseDto(reaction: Reaction): ReactionResponseDto {
    return {
      _id: reaction.id || '',
      answerId: reaction.answerId,
      userId: reaction.userId,
      reactionId: reaction.reactionId,
      gameId: reaction.gameId || undefined,
      createdAt: reaction.createdAt,
    };
  }
}
