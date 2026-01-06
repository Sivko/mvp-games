import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';
import { ReactionTypesModule } from './reaction-types/reaction-types.module';
import { AnswersModule } from './answers/answers.module';
import { GameModule } from './games/game.module';
import { Game, GameSchema } from './games/game.schema';
import { GamesService } from './games/games.service';
import { GamesController } from './games/games.controller';
import { Answer, AnswerSchema } from './answers/schemas/answer.schema';
import { UsersModule } from './users/users.module';
import { User, UserSchema } from './users/schemas/user.schema';
import { BankAssociationTextModule } from './games/bank-association-text/bank-association-text.module';
import { BankAssociationText, BankAssociationTextSchema } from './games/bank-association-text/schemas/bank-association-text.schema';
import { ReactionsModule } from './reactions/reactions.module';
import { Reaction, ReactionSchema } from './reactions/schemas/reaction.schema';
import { GameAssociationTextModule } from './games/game-association-text/game-association-text.module';
import { ComplainAssociationTextModule } from './games/complain-association-text/complain-association-text.module';
import { ComplainAssociationText, ComplainAssociationTextSchema } from './games/complain-association-text/schemas/complain-association-text.schema';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';

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
      { name: Game.name, schema: GameSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: BankAssociationText.name, schema: BankAssociationTextSchema },
      { name: Reaction.name, schema: ReactionSchema },
      { name: ComplainAssociationText.name, schema: ComplainAssociationTextSchema },
    ]),
    HttpModule,
    ReactionTypesModule,
    AnswersModule,
    GameModule,
    UsersModule,
    BankAssociationTextModule,
    ReactionsModule,
    GameAssociationTextModule,
    ComplainAssociationTextModule,
    ElasticsearchModule,
  ],
  controllers: [AppController, GamesController],
  providers: [AppService, EventsGateway, GamesService],
})
export class AppModule {}
