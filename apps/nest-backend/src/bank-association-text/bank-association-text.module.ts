import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAssociationTextSchema } from './infrastructure/schemas/bank-association-text.schema';
import { BankAssociationTextController } from './presentation/controllers/bank-association-text.controller';
import { BankAssociationTextApplicationService } from './application/services/bank-association-text.application.service';
import { MongooseBankAssociationTextRepository } from './infrastructure/persistence/mongoose-bank-association-text.repository';
import { BankAssociationTextService } from './bank-association-text.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BankAssociationText', schema: BankAssociationTextSchema },
    ]),
  ],
  controllers: [BankAssociationTextController],
  providers: [
    BankAssociationTextApplicationService,
    BankAssociationTextService,
    {
      provide: 'IBankAssociationTextRepository',
      useClass: MongooseBankAssociationTextRepository,
    },
  ],
  exports: [
    BankAssociationTextApplicationService,
    BankAssociationTextService,
    'IBankAssociationTextRepository',
    MongooseModule,
  ],
})
export class BankAssociationTextModule {}
