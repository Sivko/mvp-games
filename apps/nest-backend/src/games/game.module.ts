import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Game, GameSchema } from './infrastructure/schemas/game.schema';
import {
  BankAssociationText,
  BankAssociationTextSchema,
} from './bank-association-text/infrastructure/schemas/bank-association-text.schema';
import { GamesController } from './presentation/controllers/games.controller';
import { GameApplicationService } from './application/services/game.application.service';
import { MongooseGameRepository } from './infrastructure/persistence/mongoose-game.repository';
import { MongooseBankAssociationTextRepository } from './infrastructure/persistence/mongoose-bank-association-text.repository';
import { QuestionSelectorService } from './domain/services/question-selector.service';
import { GamesService } from './games.service';
import { BankAssociationTextModule } from './bank-association-text/bank-association-text.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Game', schema: GameSchema },
      { name: 'BankAssociationText', schema: BankAssociationTextSchema },
    ]),
    ConfigModule,
    BankAssociationTextModule,
  ],
  controllers: [GamesController],
  providers: [
    GameApplicationService,
    GamesService,
    QuestionSelectorService,
    {
      provide: 'IGameRepository',
      useClass: MongooseGameRepository,
    },
    {
      provide: 'IBankAssociationTextRepository',
      useClass: MongooseBankAssociationTextRepository,
    },
  ],
  exports: [
    GameApplicationService,
    GamesService,
    'IGameRepository',
    'IBankAssociationTextRepository',
    MongooseModule,
  ],
})
export class GameModule {}
