import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  async createGame(@Body() gameData: {
    typeGame: string;
    createdBy: string;
  }) {
    const game = await this.gamesService.createGame(gameData);
    return {
      _id: game._id.toString(),
      typeGame: game.typeGame,
      createdBy: game.createdBy.toString(),
      status: game.status,
      gamesCount: game.gamesCount,
      question: game.question,
      usedQuestions: game.usedQuestions,
    };
  }

  @Get(':id')
  async getGameById(@Param('id') id: string) {
    const game = await this.gamesService.findById(id);
    if (!game) {
      throw new Error('Game not found');
    }
    return {
      _id: game._id.toString(),
      typeGame: game.typeGame,
      createdBy: game.createdBy.toString(),
      status: game.status,
      gamesCount: game.gamesCount,
      question: game.question,
      usedQuestions: game.usedQuestions,
    };
  }

  @Get('user/:userId/active')
  async getActiveGamesByUser(@Param('userId') userId: string) {
    const games = await this.gamesService.findActiveGamesByUser(userId);
    return games.map((game) => ({
      _id: game._id.toString(),
      typeGame: game.typeGame,
      createdBy: game.createdBy.toString(),
      status: game.status,
      gamesCount: game.gamesCount,
      question: game.question,
      usedQuestions: game.usedQuestions,
    }));
  }

  @Get('user/:userId/type/:typeGame')
  async getGameByUserAndType(
    @Param('userId') userId: string,
    @Param('typeGame') typeGame: string,
  ) {
    console.log('getGameByUserAndType', userId, typeGame);
    const game = await this.gamesService.findOrCreateGameByUserAndType(userId, typeGame);
    return {
      _id: game._id.toString(),
      typeGame: game.typeGame,
      createdBy: game.createdBy.toString(),
      status: game.status,
      gamesCount: game.gamesCount,
      question: game.question,
      usedQuestions: game.usedQuestions,
    };
  }

}

