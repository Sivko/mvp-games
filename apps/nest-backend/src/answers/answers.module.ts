import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from './infrastructure/schemas/answer.schema';
import { Game, GameSchema } from '../games/infrastructure/schemas/game.schema';
import { AnswersController } from './presentation/controllers/answers.controller';
import { AnswerApplicationService } from './application/services/answer.application.service';
import { MongooseAnswerRepository } from './infrastructure/persistence/mongoose-answer.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Answer', schema: AnswerSchema },
      { name: 'Game', schema: GameSchema },
    ]),
  ],
  controllers: [AnswersController],
  providers: [
    AnswerApplicationService,
    {
      provide: 'IAnswerRepository',
      useClass: MongooseAnswerRepository,
    },
  ],
  exports: [
    AnswerApplicationService,
    'IAnswerRepository',
    MongooseModule,
  ],
})
export class AnswersModule {}
