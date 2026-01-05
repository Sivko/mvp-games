import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAssociationText, BankAssociationTextSchema } from './schemas/bank-association-text.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BankAssociationText.name, schema: BankAssociationTextSchema }]),
  ],
  exports: [MongooseModule],
})
export class BankAssociationTextModule {}

