import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { ReactionApplicationService } from '../../application/services/reaction.application.service';
import { CreateReactionDto } from '../../application/dto/create-reaction.dto';

@Controller('reactions')
export class ReactionsController {
  constructor(
    private readonly reactionApplicationService: ReactionApplicationService,
  ) {}

  @Post()
  async create(@Body() createReactionDto: CreateReactionDto) {
    return this.reactionApplicationService.create(createReactionDto);
  }

  @Get()
  async findAll() {
    return this.reactionApplicationService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reactionApplicationService.findById(id);
  }

  @Get('answer/:answerId')
  async findByAnswerId(@Param('answerId') answerId: string) {
    return this.reactionApplicationService.findByAnswerId(answerId);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.reactionApplicationService.findByUserId(userId);
  }

  @Get('game/:gameId')
  async findByGameId(@Param('gameId') gameId: string) {
    return this.reactionApplicationService.findByGameId(gameId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.reactionApplicationService.delete(id);
    return { success: true };
  }

  @Delete('answer/:answerId/user/:userId/reaction/:reactionId')
  async deleteByAnswerAndUserAndReaction(
    @Param('answerId') answerId: string,
    @Param('userId') userId: string,
    @Param('reactionId') reactionId: string,
  ) {
    await this.reactionApplicationService.deleteByAnswerAndUserAndReaction(
      answerId,
      userId,
      reactionId,
    );
    return { success: true };
  }
}
