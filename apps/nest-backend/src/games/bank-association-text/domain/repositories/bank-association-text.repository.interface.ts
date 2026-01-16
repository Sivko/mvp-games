import { BankAssociationText } from '../entities/bank-association-text.entity';

export interface IBankAssociationTextRepository {
  findById(id: string): Promise<BankAssociationText | null>;
  findAll(): Promise<BankAssociationText[]>;
  save(bankAssociationText: BankAssociationText): Promise<BankAssociationText>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<number>;
}
