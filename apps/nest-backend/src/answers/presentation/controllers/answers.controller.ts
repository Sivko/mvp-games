import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnswerApplicationService } from '../../application/services/answer.application.service';
import { CreateAnswerDto } from '../../application/dto/create-answer.dto';
import { UpdateAnswerDto } from '../../application/dto/update-answer.dto';
import { AnswerQueryDto } from '../../application/dto/answer-query.dto';

@Controller('answers')
export class AnswersController {
  constructor(
    private readonly answerApplicationService: AnswerApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAnswerDto: CreateAnswerDto) {
    return this.answerApplicationService.create(createAnswerDto);
  }

  @Post('by-question')
  @HttpCode(HttpStatus.CREATED)
  async createByQuestion(
    @Body()
    createDto: {
      question: string;
      text: string;
      bankAssociationTextId?: string;
      score?: number;
    },
  ) {
    // This method creates answer without game - keeping for backward compatibility
    const createAnswerDto: CreateAnswerDto = {
      text: createDto.text,
      bankAssociationTextId: createDto.bankAssociationTextId,
    };
    const answer = await this.answerApplicationService.create(createAnswerDto);
    if (createDto.score !== undefined) {
      return this.answerApplicationService.update(answer._id, {
        score: createDto.score,
      });
    }
    return answer;
  }

  @Get('game/:gameId')
  async findByGameId(@Param('gameId') gameId: string) {
    return this.answerApplicationService.findByGameId(gameId);
  }

  @Get('by-question')
  async findByQuestionExcludingGame(@Query() query: AnswerQueryDto) {
    return this.answerApplicationService.findByQuestionExcludingGame(query);
  }

  @Get('by-question/all')
  async findByQuestion(@Query() query: AnswerQueryDto) {
    return this.answerApplicationService.findByQuestion(query);
  }

  @Get('by-bank-association-text-id/:bankAssociationTextId')
  async findByBankAssociationTextId(
    @Param('bankAssociationTextId') bankAssociationTextId: string,
    @Query() query: AnswerQueryDto,
  ) {
    return this.answerApplicationService.findByBankAssociationTextId({
      ...query,
      bankAssociationTextId,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.answerApplicationService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ) {
    return this.answerApplicationService.update(id, updateAnswerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.answerApplicationService.delete(id);
    return { success: true };
  }
}
