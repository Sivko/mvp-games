import { Controller, Post, Get, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { AnswersService } from './answers.service';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  async create(@Body() createDto: {
    gameId?: string;
    userId?: string;
    text: string;
    bankAssociationTextId?: string;
  }) {
    return this.answersService.create(createDto);
  }

  @Post('by-question')
  async createByQuestion(@Body() createDto: {
    question: string;
    text: string;
    bankAssociationTextId?: string;
    score?: number;
  }) {
    return this.answersService.createByQuestion(
      createDto.question,
      createDto.text,
      createDto.bankAssociationTextId,
      createDto.score,
    );
  }

  @Get('game/:gameId')
  async findByGameId(@Param('gameId') gameId: string) {
    return this.answersService.findByGameId(gameId);
  }

  @Get('by-question')
  async findByQuestionExcludingGame(
    @Query('question') question: string,
    @Query('excludeGameId') excludeGameId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.answersService.findByQuestionExcludingGame(
      question,
      excludeGameId,
      pageNum,
      limitNum,
    );
  }

  @Get('by-question/all')
  async findByQuestion(
    @Query('question') question: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    return this.answersService.findByQuestion(question, pageNum, limitNum);
  }

  @Get('by-bank-association-text-id/:bankAssociationTextId')
  async findByBankAssociationTextId(
    @Param('bankAssociationTextId') bankAssociationTextId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    return this.answersService.findByBankAssociationTextId(
      bankAssociationTextId,
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.answersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: { text?: string; score?: number },
  ) {
    return this.answersService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.answersService.delete(id);
    return { success: true };
  }
}

