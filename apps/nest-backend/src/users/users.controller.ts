import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('find-or-create')
  async findOrCreate(@Body() userData: {
    name?: string;
    telegramId?: number;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramLastName?: string;
    telegramPhotoUrl?: string;
    telegramLanguageCode?: string;
  }) {
    const userId = await this.usersService.findOrCreateUser(userData);
    const user = await this.usersService.findById(userId);
    return {
      id: userId,
      name: user?.name,
      telegramFirstName: user?.telegramFirstName,
      telegramUsername: user?.telegramUsername,
    };
  }
}


