export class Reaction {
  private constructor(
    private readonly _id: string | null,
    private readonly _answerId: string,
    private readonly _userId: string,
    private readonly _reactionId: string,
    private readonly _gameId: string | null,
    private readonly _createdAt?: Date,
  ) {}

  static create(
    answerId: string,
    userId: string,
    reactionId: string,
    gameId?: string,
  ): Reaction {
    return new Reaction(null, answerId, userId, reactionId, gameId || null);
  }

  static reconstitute(
    id: string,
    answerId: string,
    userId: string,
    reactionId: string,
    gameId: string | null,
    createdAt?: Date,
  ): Reaction {
    return new Reaction(id, answerId, userId, reactionId, gameId, createdAt);
  }

  get id(): string | null {
    return this._id;
  }

  get answerId(): string {
    return this._answerId;
  }

  get userId(): string {
    return this._userId;
  }

  get reactionId(): string {
    return this._reactionId;
  }

  get gameId(): string | null {
    return this._gameId;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }
}
