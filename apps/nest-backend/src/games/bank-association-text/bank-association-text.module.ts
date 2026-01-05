import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAssociationText, BankAssociationTextSchema } from './schemas/bank-association-text.schema';
import { BankAssociationTextService } from './bank-association-text.service';
import { BankAssociationTextController } from './bank-association-text.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BankAssociationText.name, schema: BankAssociationTextSchema }]),
  ],
  controllers: [BankAssociationTextController],
  providers: [BankAssociationTextService],
  exports: [BankAssociationTextService, MongooseModule],
})
export class BankAssociationTextModule {}

