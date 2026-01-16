export interface BankAssociationTextData {
  _id: string;
  question: string;
  status: boolean;
}

export interface IBankAssociationTextRepository {
  findAll(): Promise<BankAssociationTextData[]>;
  findById(id: string): Promise<BankAssociationTextData | null>;
}
