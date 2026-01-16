import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBankAssociationTextRepository } from '../../domain/repositories/bank-association-text.repository.interface';
import { BankAssociationText } from '../../domain/entities/bank-association-text.entity';
import { CreateBankAssociationTextDto } from '../dto/create-bank-association-text.dto';
import { BankAssociationTextResponseDto } from '../dto/bank-association-text-response.dto';

@Injectable()
export class BankAssociationTextApplicationService {
  constructor(
    @Inject('IBankAssociationTextRepository')
    private readonly repository: IBankAssociationTextRepository,
  ) {}

  async create(
    createDto: CreateBankAssociationTextDto,
  ): Promise<BankAssociationTextResponseDto> {
    const entity = BankAssociationText.create(
      createDto.question,
      createDto.status ?? true,
    );
    const saved = await this.repository.save(entity);
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<BankAssociationTextResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async findById(id: string): Promise<BankAssociationTextResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(
        `BankAssociationText with ID ${id} not found`,
      );
    }
    return this.toResponseDto(entity);
  }

  async update(
    id: string,
    updateDto: Partial<CreateBankAssociationTextDto>,
  ): Promise<BankAssociationTextResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(
        `BankAssociationText with ID ${id} not found`,
      );
    }

    const updated = BankAssociationText.reconstitute(
      entity.id!,
      updateDto.question ?? entity.question,
      updateDto.status ?? entity.status,
      entity.createdAt,
      entity.updatedAt,
    );

    const saved = await this.repository.save(updated);
    return this.toResponseDto(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteAll(): Promise<{ deletedCount: number }> {
    const count = await this.repository.deleteAll();
    return { deletedCount: count };
  }

  private toResponseDto(
    entity: BankAssociationText,
  ): BankAssociationTextResponseDto {
    return {
      _id: entity.id || '',
      question: entity.question,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
