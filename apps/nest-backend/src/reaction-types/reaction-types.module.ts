import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionTypesService } from './reaction-types.service';
import { ReactionType, ReactionTypeSchema } from './schemas/reaction-types.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReactionType.name, schema: ReactionTypeSchema }]),
  ],
  providers: [ReactionTypesService],
  exports: [ReactionTypesService],
})
export class ReactionTypesModule {}

