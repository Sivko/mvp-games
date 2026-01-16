import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IAnswerRepository } from '../../domain/repositories/answer.repository.interface';
import { Answer } from '../../domain/entities/answer.entity';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { AnswerResponseDto } from '../dto/answer-response.dto';
import { AnswerQueryDto } from '../dto/answer-query.dto';

@Injectable()
export class AnswerApplicationService {
  constructor(
    @Inject('IAnswerRepository')
    private readonly answerRepository: IAnswerRepository,
  ) {}

  async create(createAnswerDto: CreateAnswerDto): Promise<AnswerResponseDto> {
    const answer = Answer.create(
      createAnswerDto.text,
      createAnswerDto.gameId,
      createAnswerDto.userId,
      createAnswerDto.bankAssociationTextId,
    );
    const saved = await this.answerRepository.save(answer);
    return this.toResponseDto(saved);
  }

  async findById(id: string): Promise<AnswerResponseDto> {
    const answer = await this.answerRepository.findById(id);
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }
    return this.toResponseDto(answer);
  }

  async findByGameId(gameId: string): Promise<AnswerResponseDto[]> {
    const answers = await this.answerRepository.findByGameId(gameId);
    return answers.map((answer) => this.toResponseDto(answer));
  }

  async findByGameIdAndUserId(
    gameId: string,
    userId: string,
  ): Promise<AnswerResponseDto | null> {
    const answer = await this.answerRepository.findByGameIdAndUserId(
      gameId,
      userId,
    );
    return answer ? this.toResponseDto(answer) : null;
  }

  async findByQuestion(
    query: AnswerQueryDto,
  ): Promise<{ answers: AnswerResponseDto[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const result = await this.answerRepository.findByQuestion(
      query.question!,
      page,
      limit,
    );
    return {
      answers: result.answers.map((answer) => this.toResponseDto(answer)),
      total: result.total,
    };
  }

  async findByQuestionExcludingGame(
    query: AnswerQueryDto,
  ): Promise<{ answers: AnswerResponseDto[]; total: number }> {
    if (!query.question || !query.excludeGameId) {
      throw new Error('question and excludeGameId are required');
    }
    const page = query.page || 1;
    const limit = query.limit || 10;
    const result = await this.answerRepository.findByQuestionExcludingGame(
      query.question,
      query.excludeGameId,
      page,
      limit,
    );
    return {
      answers: result.answers.map((answer) => this.toResponseDto(answer)),
      total: result.total,
    };
  }

  async findByBankAssociationTextId(
    query: AnswerQueryDto,
  ): Promise<{ answers: AnswerResponseDto[]; total: number }> {
    if (!query.bankAssociationTextId) {
      throw new Error('bankAssociationTextId is required');
    }
    const page = query.page || 1;
    const limit = query.limit || 50;
    const result = await this.answerRepository.findByBankAssociationTextId(
      query.bankAssociationTextId,
      page,
      limit,
    );
    return {
      answers: result.answers.map((answer) => this.toResponseDto(answer)),
      total: result.total,
    };
  }

  async update(
    id: string,
    updateAnswerDto: UpdateAnswerDto,
  ): Promise<AnswerResponseDto> {
    const answer = await this.answerRepository.findById(id);
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }

    if (updateAnswerDto.text !== undefined) {
      answer.updateText(updateAnswerDto.text);
    }
    if (updateAnswerDto.score !== undefined) {
      answer.updateScore(updateAnswerDto.score);
    }

    const saved = await this.answerRepository.save(answer);
    return this.toResponseDto(saved);
  }

  async delete(id: string): Promise<void> {
    await this.answerRepository.delete(id);
  }

  private toResponseDto(answer: Answer): AnswerResponseDto {
    return {
      _id: answer.id || '',
      gameId: answer.gameId || undefined,
      userId: answer.userId || undefined,
      text: answer.text,
      similarity: answer.similarity,
      stats: answer.stats.toObject(),
      score: answer.score,
      bankAssociationTextId: answer.bankAssociationTextId || undefined,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    };
  }
}
