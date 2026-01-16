import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';
import { ReactionTypesModule } from './reaction-types/reaction-types.module';
import { AnswersModule } from './answers/answers.module';
import { GameModule } from './games/game.module';
import { Game, GameSchema } from './games/infrastructure/schemas/game.schema';
import {
  Answer,
  AnswerSchema,
} from './answers/infrastructure/schemas/answer.schema';
import { UsersModule } from './users/users.module';
import { User, UserSchema } from './users/infrastructure/schemas/user.schema';
import { BankAssociationTextModule } from './bank-association-text/bank-association-text.module';
import {
  BankAssociationText,
  BankAssociationTextSchema,
} from './bank-association-text/infrastructure/schemas/bank-association-text.schema';
import { ReactionsModule } from './reactions/reactions.module';
import {
  Reaction,
  ReactionSchema,
} from './reactions/infrastructure/schemas/reaction.schema';
import { ComplainAssociationTextModule } from './complain-association-text/complain-association-text.module';
import {
  ComplainAssociationText,
  ComplainAssociationTextSchema,
} from './complain-association-text/schemas/complain-association-text.schema';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // ConfigModule автоматически читает из process.env (переменные из docker-compose)
      // и дополнительно пытается загрузить из файлов ниже
      // Если файл не найден, переменные из process.env все равно будут доступны
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? [
              join(process.cwd(), '.env.production'), // Production окружение
              join(process.cwd(), '.env'), // Fallback
            ]
          : [
              join(`${process.cwd()}/../../.env`), // Development окружение
            ],
      // Не игнорируем переменные окружения, даже если файл не найден
      ignoreEnvFile: false,
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const mongoHost =
          configService.get<string>('MONGODB_HOST') || 'localhost';
        const mongoPort = configService.get<string>('MONGODB_PORT') || '27017';
        const mongoLogin = configService.get<string>('MONGODB_LOGIN');
        const mongoPass = configService.get<string>('MONGODB_PASS');

        if (!mongoLogin || !mongoPass) {
          throw new Error('MONGODB_LOGIN and MONGODB_PASS must be provided');
        }

        // URL encode credentials to handle special characters
        const encodedLogin = encodeURIComponent(mongoLogin);
        const encodedPass = encodeURIComponent(mongoPass);
        const uri = `mongodb://${encodedLogin}:${encodedPass}@${mongoHost}:${mongoPort}/?authSource=admin`;
        console.log(
          `Connecting to MongoDB at ${mongoHost}:${mongoPort} with user ${mongoLogin}`,
        );
        console.log(
          `MongoDB URI: mongodb://${encodedLogin}:***@${mongoHost}:${mongoPort}/?authSource=admin`,
        );

        return {
          uri,
          dbName: 'word-game',
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: BankAssociationText.name, schema: BankAssociationTextSchema },
      { name: Reaction.name, schema: ReactionSchema },
      {
        name: ComplainAssociationText.name,
        schema: ComplainAssociationTextSchema,
      },
    ]),
    HttpModule,
    ReactionTypesModule,
    AnswersModule,
    GameModule,
    UsersModule,
    BankAssociationTextModule,
    ReactionsModule,
    ComplainAssociationTextModule,
    ElasticsearchModule,
    TelegramBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
