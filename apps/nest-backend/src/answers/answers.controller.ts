import { Controller, Post, Get, Body, Param } from '@nestjs/common';
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

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.answersService.findById(id);
  }
}

