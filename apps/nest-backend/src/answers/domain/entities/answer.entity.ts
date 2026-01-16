import { AnswerStats } from '../value-objects/answer-stats.vo';

export class Answer {
  private constructor(
    private readonly _id: string | null,
    private readonly _gameId: string | null,
    private readonly _userId: string | null,
    private _text: string,
    private _similarity: number,
    private _stats: AnswerStats,
    private _score: number,
    private readonly _bankAssociationTextId: string | null,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  static create(
    text: string,
    gameId?: string,
    userId?: string,
    bankAssociationTextId?: string,
  ): Answer {
    return new Answer(
      null,
      gameId || null,
      userId || null,
      text,
      0,
      AnswerStats.create(),
      0,
      bankAssociationTextId || null,
    );
  }

  static reconstitute(
    id: string,
    gameId: string | null,
    userId: string | null,
    text: string,
    similarity: number,
    stats: { totalReactions: number; uniqueUsersReacted: number },
    score: number,
    bankAssociationTextId: string | null,
    createdAt?: Date,
    updatedAt?: Date,
  ): Answer {
    return new Answer(
      id,
      gameId,
      userId,
      text,
      similarity,
      AnswerStats.create(stats.totalReactions, stats.uniqueUsersReacted),
      score,
      bankAssociationTextId,
      createdAt,
      updatedAt,
    );
  }

  // Getters
  get id(): string | null {
    return this._id;
  }

  get gameId(): string | null {
    return this._gameId;
  }

  get userId(): string | null {
    return this._userId;
  }

  get text(): string {
    return this._text;
  }

  get similarity(): number {
    return this._similarity;
  }

  get stats(): AnswerStats {
    return this._stats;
  }

  get score(): number {
    return this._score;
  }

  get bankAssociationTextId(): string | null {
    return this._bankAssociationTextId;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Business logic
  updateText(text: string): void {
    this._text = text;
  }

  updateSimilarity(similarity: number): void {
    this._similarity = similarity;
  }

  updateScore(score: number): void {
    this._score = score;
  }

  incrementReactions(): void {
    this._stats = this._stats.incrementReactions();
  }

  incrementUniqueUsers(): void {
    this._stats = this._stats.incrementUniqueUsers();
  }
}
