import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAssociationText, BankAssociationTextSchema } from './schemas/bank-association-text.schema';
import { BankAssociationTextService } from './bank-association-text.service';
import { BankAssociationTextController } from './bank-association-text.controller';
import { ImportDataService } from './import-data.service';
import { AnswersModule } from '../../answers/answers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BankAssociationText.name, schema: BankAssociationTextSchema }]),
    AnswersModule,
  ],
  controllers: [BankAssociationTextController],
  providers: [BankAssociationTextService, ImportDataService],
  exports: [BankAssociationTextService, MongooseModule],
})
export class BankAssociationTextModule {}

