import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';
import { RoomModule } from './room/room.module';
import { SearchWordService } from './games/g-search-word/search-word.service';
import { Room, RoomSchema } from './room/schemas/room.schema';
import { ReactionTypesModule } from './reaction-types/reaction-types.module';
import { AnswersModule } from './answers/answers.module';
import { GameModule } from './games/game.module';
import { Game, GameSchema } from './games/schemas/game.schema';
import { Answer, AnswerSchema } from './answers/schemas/answer.schema';
import { UsersModule } from './users/users.module';
import { User, UserSchema } from './users/schemas/user.schema';
import { BankAssociationTextModule } from './games/bank-association-text/bank-association-text.module';
import { BankAssociationText, BankAssociationTextSchema } from './games/bank-association-text/schemas/bank-association-text.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Проверяем .env файл в корне проекта (относительно текущей рабочей директории)
      // и относительный путь от скомпилированного файла
      envFilePath: [
        join(`${process.cwd()}/../../.env`), // Корень проекта
      ],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: `mongodb://${configService.get('MDB_LOGIN')}:${configService.get('MDB_PASS')}@localhost:27017`,
        dbName: 'word-game',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Game.name, schema: GameSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: BankAssociationText.name, schema: BankAssociationTextSchema },
    ]),
    HttpModule,
    RoomModule,
    ReactionTypesModule,
    AnswersModule,
    GameModule,
    UsersModule,
    BankAssociationTextModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway, SearchWordService],
})
export class AppModule {}
