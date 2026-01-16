export class BankAssociationText {
  private constructor(
    private readonly _id: string | null,
    private readonly _question: string,
    private readonly _status: boolean,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  static create(question: string, status: boolean = true): BankAssociationText {
    return new BankAssociationText(null, question, status);
  }

  static reconstitute(
    id: string,
    question: string,
    status: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): BankAssociationText {
    return new BankAssociationText(id, question, status, createdAt, updatedAt);
  }

  get id(): string | null {
    return this._id;
  }

  get question(): string {
    return this._question;
  }

  get status(): boolean {
    return this._status;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  isActive(): boolean {
    return this._status;
  }
}
