import { Module } from '@nestjs/common';
import { GameAssociationTextGateway } from './game-association-text.gateway';
import { AnswersModule } from '../../answers/answers.module';
import { ReactionsModule } from '../../reactions/reactions.module';
import { UsersModule } from '../../users/users.module';
import { GamesService } from '../games.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from '../game.schema';
import { BankAssociationTextModule } from '../bank-association-text/bank-association-text.module';
import { ElasticsearchModule } from '../../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    AnswersModule,
    ReactionsModule,
    UsersModule,
    BankAssociationTextModule,
    ElasticsearchModule,
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
  ],
  providers: [GameAssociationTextGateway, GamesService],
})
export class GameAssociationTextModule {}

