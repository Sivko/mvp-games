import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ReactionsService } from './reactions.service';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get()
  async findAll() {
    return this.reactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reactionsService.findById(id);
  }

  @Get('answer/:answerId')
  async findByAnswerId(@Param('answerId') answerId: string) {
    return this.reactionsService.findByAnswerId(answerId);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.reactionsService.findByUserId(userId);
  }

  @Get('game/:gameId')
  async findByGameId(@Param('gameId') gameId: string) {
    return this.reactionsService.findByGameId(gameId);
  }

  @Post()
  async create(
    @Body()
    createDto: {
      answerId: string;
      userId: string;
      reactionId: string;
    },
  ) {
    return this.reactionsService.create(createDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reactionsService.delete(id);
  }

  @Delete('answer/:answerId/user/:userId/reaction/:reactionId')
  async deleteByAnswerAndUserAndReaction(
    @Param('answerId') answerId: string,
    @Param('userId') userId: string,
    @Param('reactionId') reactionId: string,
  ) {
    return this.reactionsService.deleteByAnswerAndUserAndReaction(
      answerId,
      userId,
      reactionId,
    );
  }
}
