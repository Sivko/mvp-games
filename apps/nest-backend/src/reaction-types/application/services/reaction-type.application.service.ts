import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IReactionTypeRepository } from '../../domain/repositories/reaction-type.repository.interface';
import { ReactionType } from '../../domain/entities/reaction-type.entity';
import { CreateReactionTypeDto } from '../dto/create-reaction-type.dto';
import { ReactionTypeResponseDto } from '../dto/reaction-type-response.dto';

@Injectable()
export class ReactionTypeApplicationService {
  constructor(
    @Inject('IReactionTypeRepository')
    private readonly reactionTypeRepository: IReactionTypeRepository,
  ) {}

  async create(
    createDto: CreateReactionTypeDto,
  ): Promise<ReactionTypeResponseDto> {
    const reactionType = ReactionType.create(
      createDto.name,
      createDto.textFromFinalRound,
      createDto.image,
    );
    const saved = await this.reactionTypeRepository.save(reactionType);
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<ReactionTypeResponseDto[]> {
    const reactionTypes = await this.reactionTypeRepository.findAll();
    return reactionTypes.map((rt) => this.toResponseDto(rt));
  }

  async findOne(id: string): Promise<ReactionTypeResponseDto> {
    const reactionType = await this.reactionTypeRepository.findById(id);
    if (!reactionType) {
      throw new NotFoundException(`ReactionType with ID ${id} not found`);
    }
    return this.toResponseDto(reactionType);
  }

  async update(
    id: string,
    updateDto: Partial<CreateReactionTypeDto>,
  ): Promise<ReactionTypeResponseDto> {
    const reactionType = await this.reactionTypeRepository.findById(id);
    if (!reactionType) {
      throw new NotFoundException(`ReactionType with ID ${id} not found`);
    }

    const updated = ReactionType.reconstitute(
      reactionType.id!,
      updateDto.name ?? reactionType.name,
      updateDto.textFromFinalRound ?? reactionType.textFromFinalRound,
      updateDto.image ?? reactionType.image,
      reactionType.createdAt,
      reactionType.updatedAt,
    );

    const saved = await this.reactionTypeRepository.save(updated);
    return this.toResponseDto(saved);
  }

  async delete(id: string): Promise<void> {
    await this.reactionTypeRepository.delete(id);
  }

  private toResponseDto(reactionType: ReactionType): ReactionTypeResponseDto {
    return {
      _id: reactionType.id || '',
      name: reactionType.name,
      image: reactionType.image,
      textFromFinalRound: reactionType.textFromFinalRound,
      createdAt: reactionType.createdAt,
      updatedAt: reactionType.updatedAt,
    };
  }
}
