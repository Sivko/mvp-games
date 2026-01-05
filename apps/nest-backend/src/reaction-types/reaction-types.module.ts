import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionTypesService } from './reaction-types.service';
import { ReactionTypesController } from './reaction-types.controller';
import { ReactionType, ReactionTypeSchema } from './schemas/reaction-types.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReactionType.name, schema: ReactionTypeSchema }]),
  ],
  controllers: [ReactionTypesController],
  providers: [ReactionTypesService],
  exports: [ReactionTypesService],
})
export class ReactionTypesModule {}

