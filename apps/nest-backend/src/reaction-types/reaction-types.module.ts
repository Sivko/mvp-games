import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReactionType,
  ReactionTypeSchema,
} from './infrastructure/schemas/reaction-types.schema';
import { ReactionTypesController } from './presentation/controllers/reaction-types.controller';
import { ReactionTypeApplicationService } from './application/services/reaction-type.application.service';
import { MongooseReactionTypeRepository } from './infrastructure/persistence/mongoose-reaction-type.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ReactionType', schema: ReactionTypeSchema },
    ]),
  ],
  controllers: [ReactionTypesController],
  providers: [
    ReactionTypeApplicationService,
    {
      provide: 'IReactionTypeRepository',
      useClass: MongooseReactionTypeRepository,
    },
  ],
  exports: [
    ReactionTypeApplicationService,
    'IReactionTypeRepository',
    MongooseModule,
  ],
})
export class ReactionTypesModule {}
