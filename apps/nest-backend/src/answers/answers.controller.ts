import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AnswersService } from './answers.service';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  async create(@Body() createDto: {
    gameId: string;
    userId: string;
    text: string;
  }) {
    return this.answersService.create(createDto);
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

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.answersService.findById(id);
  }
}

