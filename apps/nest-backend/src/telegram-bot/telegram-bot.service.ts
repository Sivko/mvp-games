import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: any;

  constructor(private configService: ConfigService) {
    this.logger.log('TelegramBotService constructor called');
  }

  async onModuleInit() {
    this.logger.log('onModuleInit called - starting Telegram bot initialization');
    
    const token = this.configService.get<string>('TG_BOT_TOKEN');
    this.logger.log(`TG_BOT_TOKEN exists: ${!!token}`);

    if (!token) {
      this.logger.warn('TG_BOT_TOKEN not found in environment variables. Telegram bot will not be initialized.');
      return;
    }

    try {
      // Импортируем модуль через require для правильной работы с CommonJS
      const TelegramBotModule = require('node-telegram-bot-api');
      // Модуль может экспортироваться как default или напрямую
      const TelegramBot = TelegramBotModule.default || TelegramBotModule;
      
      // Создаем бота без автоматического polling
      this.bot = new TelegramBot(token, { polling: false });
      this.logger.log('TelegramBot instance created');
      
      // Устанавливаем обработчики перед запуском polling
      this.setupHandlers();
      this.logger.log('Handlers set up');
      
      // Явно запускаем polling
      this.bot.startPolling();
      this.logger.log('Telegram bot initialized successfully and polling started');
    } catch (error) {
      this.logger.error(`Failed to initialize Telegram bot: ${error.message}`, error.stack);
    }
  }

  private setupHandlers() {
    // Обработка команды /start
    this.bot.onText(/\/start/, (msg) => {
      this.logger.log(`Received /start command from chat ${msg.chat.id}`);
      const chatId = msg.chat.id;
      const message = 'Цель участников игры «Сто к одному» состоит в том, чтобы угадать наиболее распространённые ответы людей на предложенные вопросы, на которые невозможно дать однозначный объективный ответ. Начните сейчас https://t.me/top_otvet_bot';
      
      this.bot.sendMessage(chatId, message)
        .then(() => {
          this.logger.log(`Sent /start response to chat ${chatId}`);
        })
        .catch((error) => {
          this.logger.error(`Failed to send message to chat ${chatId}: ${error.message}`, error.stack);
        });
    });

    // Обработка всех сообщений для отладки
    this.bot.on('message', (msg) => {
      this.logger.log(`Received message from chat ${msg.chat.id}: ${msg.text || '(no text)'}`);
    });

    // Обработка ошибок бота
    this.bot.on('polling_error', (error) => {
      this.logger.error(`Telegram bot polling error: ${error.message}`, error.stack);
    });

    // Обработка успешного запуска polling
    this.bot.on('polling', () => {
      this.logger.log('Polling is active');
    });
  }
}
