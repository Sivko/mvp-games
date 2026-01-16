import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionSchema } from './infrastructure/schemas/reaction.schema';
import { ReactionsController } from './presentation/controllers/reactions.controller';
import { ReactionApplicationService } from './application/services/reaction.application.service';
import { MongooseReactionRepository } from './infrastructure/persistence/mongoose-reaction.repository';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reaction', schema: ReactionSchema }]),
  ],
  controllers: [ReactionsController],
  providers: [
    ReactionApplicationService,
    ReactionsService,
    {
      provide: 'IReactionRepository',
      useClass: MongooseReactionRepository,
    },
  ],
  exports: [
    ReactionApplicationService,
    ReactionsService,
    'IReactionRepository',
    MongooseModule,
  ],
})
export class ReactionsModule {}
