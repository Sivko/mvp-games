import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GameApplicationService } from '../../application/services/game.application.service';
import { CreateGameDto } from '../../application/dto/create-game.dto';
import { UpdateStatsDto } from '../../application/dto/update-stats.dto';
import { FinishGameDto } from '../../application/dto/finish-game.dto';

@Controller('games')
export class GamesController {
  constructor(
    private readonly gameApplicationService: GameApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    return this.gameApplicationService.createGame(createGameDto);
  }

  @Get(':id')
  async getGameById(@Param('id') id: string) {
    return this.gameApplicationService.findById(id);
  }

  @Get('user/:userId/active')
  async getActiveGamesByUser(@Param('userId') userId: string) {
    return this.gameApplicationService.findActiveGamesByUser(userId);
  }

  @Get('user/:userId/type/:typeGame')
  async getGameByUserAndType(
    @Param('userId') userId: string,
    @Param('typeGame') typeGame: string,
  ) {
    return this.gameApplicationService.findOrCreateGameByUserAndType(
      userId,
      typeGame,
    );
  }

  @Get('user/:userId/participant')
  async getActiveGamesByParticipant(@Param('userId') userId: string) {
    return this.gameApplicationService.findActiveGamesByParticipant(userId);
  }

  @Get('invite/:inviteUserId/:typeGame')
  async getGameByInvite(
    @Param('inviteUserId') inviteUserId: string,
    @Param('typeGame') typeGame: string,
  ) {
    return this.gameApplicationService.findActiveGameByInvite(
      inviteUserId,
      typeGame,
    );
  }
}
