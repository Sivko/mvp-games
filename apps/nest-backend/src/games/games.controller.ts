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

  @Get('type/:typeGame')
  async getGamesByType(@Param('typeGame') typeGame: string) {
    const games = await this.gamesService.findByType(typeGame);
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

  @Get('stats/:typeGame')
  async getGameStats(@Param('typeGame') typeGame: string) {
    const activeCount = await this.gamesService.getActiveGamesCountByType(typeGame);
    return {
      typeGame,
      activeGamesCount: activeCount,
      // Пока возвращаем 0 онлайн пользователей, позже можно добавить через WebSocket
      onlineUsersCount: 0,
    };
  }

  @Get('stats/user/:userId')
  async getUserGameStats(@Param('userId') userId: string) {
    const stats = await this.gamesService.getUserGameStats(userId);
    return stats.map((stat) => ({
      typeGame: stat.typeGame,
      activeGamesCount: stat.count,
      // Пока возвращаем 0 онлайн пользователей, позже можно добавить через WebSocket
      onlineUsersCount: 0,
    }));
  }

  @Get('user/:userId/type/:typeGame/active')
  async getActiveGameByUserAndType(
    @Param('userId') userId: string,
    @Param('typeGame') typeGame: string,
  ) {
    const game = await this.gamesService.findActiveGameByUserAndType(userId, typeGame);
    if (!game) {
      return null;
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
}

