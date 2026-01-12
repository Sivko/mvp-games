import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionTypesService } from './reaction-types.service';
import { ReactionTypesController } from './reaction-types.controller';
import { ReactionType, ReactionTypeSchema } from './schemas/reaction-types.schema';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReactionType.name, schema: ReactionTypeSchema }]),
  ],
  controllers: [ReactionTypesController],
  providers: [ReactionTypesService, AdminAuthGuard],
  exports: [ReactionTypesService],
})
export class ReactionTypesModule {}

