import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplainAssociationText, ComplainAssociationTextSchema } from './schemas/complain-association-text.schema';
import { ComplainAssociationTextService } from './complain-association-text.service';
import { ComplainAssociationTextController } from './complain-association-text.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ComplainAssociationText.name, schema: ComplainAssociationTextSchema }]),
  ],
  controllers: [ComplainAssociationTextController],
  providers: [ComplainAssociationTextService],
  exports: [ComplainAssociationTextService, MongooseModule],
})
export class ComplainAssociationTextModule {}

