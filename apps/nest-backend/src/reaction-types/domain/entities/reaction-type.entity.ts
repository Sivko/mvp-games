export class ReactionType {
  private constructor(
    private readonly _id: string | null,
    private readonly _name: string,
    private readonly _textFromFinalRound: string | null,
    private readonly _image: string | null,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  static create(
    name: string,
    textFromFinalRound?: string | null,
    image?: string | null,
  ): ReactionType {
    return new ReactionType(
      null,
      name,
      textFromFinalRound || null,
      image || null,
    );
  }

  static reconstitute(
    id: string,
    name: string,
    textFromFinalRound: string | null,
    image: string | null,
    createdAt?: Date,
    updatedAt?: Date,
  ): ReactionType {
    return new ReactionType(
      id,
      name,
      textFromFinalRound,
      image,
      createdAt,
      updatedAt,
    );
  }

  get id(): string | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get textFromFinalRound(): string | null {
    return this._textFromFinalRound;
  }

  get image(): string | null {
    return this._image;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
}
