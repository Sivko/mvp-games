import { Module } from '@nestjs/common';
import { GameAssociationTextGateway } from './game-association-text.gateway';
import { AnswersModule } from '../../answers/answers.module';
import { ReactionsModule } from '../../reactions/reactions.module';
import { UsersModule } from '../../users/users.module';
import { GameModule } from '../game.module';
import { BankAssociationTextModule } from '../bank-association-text/bank-association-text.module';
import { ElasticsearchModule } from '../../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    AnswersModule,
    ReactionsModule,
    UsersModule,
    GameModule,
    BankAssociationTextModule,
    ElasticsearchModule,
  ],
  providers: [GameAssociationTextGateway],
})
export class GameAssociationTextModule {}
