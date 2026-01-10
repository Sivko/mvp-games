import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { validateTelegramInitData } from './telegram-auth.util';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('auth/telegram')
  async authByTelegram(@Body() body: { initData: string }) {
    const { initData } = body;

    if (!initData) {
      throw new BadRequestException('initData is required');
    }

    const botToken = this.configService.get<string>('TG_BOT_TOKEN');
    if (!botToken) {
      throw new BadRequestException('TG_BOT_TOKEN is not configured');
    }

    // Валидируем initData
    const { isValid, userData } = validateTelegramInitData(initData, botToken);

    if (!isValid || !userData) {
      throw new BadRequestException('Invalid Telegram initData');
    }

    // Создаем или находим пользователя
    const userDataForCreate = {
      telegramId: userData.id,
      telegramUsername: userData.username,
      telegramFirstName: userData.first_name,
      telegramLastName: userData.last_name,
      telegramPhotoUrl: userData.photo_url,
      telegramLanguageCode: userData.language_code,
    };

    const userId = await this.usersService.findOrCreateUser(userDataForCreate);
    const user = await this.usersService.findById(userId);

    return {
      id: userId,
      name: user?.name,
      telegramFirstName: user?.telegramFirstName,
      telegramUsername: user?.telegramUsername,
    };
  }

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


