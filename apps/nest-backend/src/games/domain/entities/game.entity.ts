import { GameStatus, GameStatusEnum } from '../value-objects/game-status.vo';
import { GameType } from '../value-objects/game-type.vo';
import { GameStats } from '../value-objects/game-stats.vo';
import { GameCreatedEvent } from '../events/game-created.event';
import { GameFinishedEvent } from '../events/game-finished.event';
import { RoundIncrementedEvent } from '../events/round-incremented.event';

export class Game {
  private domainEvents: Array<
    GameCreatedEvent | GameFinishedEvent | RoundIncrementedEvent
  > = [];

  private constructor(
    private readonly _id: string | null,
    private readonly _number: string,
    private _status: GameStatus,
    private readonly _typeGame: GameType,
    private readonly _createdBy: string,
    private _question: string,
    private _usedQuestions: string[],
    private _currentRound: number,
    private readonly _maxRounds: number,
    private _gamesCount: number,
    private _users: string[],
    private readonly _blackListUsers: string[],
    private _stats: GameStats,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  static create(
    typeGame: string,
    createdBy: string,
    question: string = '',
    usedQuestions: string[] = [],
    maxRounds: number = 10,
    number: string = '1',
  ): Game {
    const game = new Game(
      null,
      number,
      GameStatus.active(),
      GameType.create(typeGame),
      createdBy,
      question,
      usedQuestions,
      1,
      maxRounds,
      0,
      [],
      [],
      GameStats.create(),
    );

    game.addDomainEvent(new GameCreatedEvent('', typeGame, createdBy));

    return game;
  }

  static reconstitute(
    id: string,
    number: string,
    status: string,
    typeGame: string,
    createdBy: string,
    question: string,
    usedQuestions: string[],
    currentRound: number,
    maxRounds: number,
    gamesCount: number,
    users: string[],
    blackListUsers: string[],
    stats: Map<string, number>,
    createdAt?: Date,
    updatedAt?: Date,
  ): Game {
    return new Game(
      id,
      number,
      GameStatus.create(status),
      GameType.create(typeGame),
      createdBy,
      question,
      usedQuestions,
      currentRound,
      maxRounds,
      gamesCount,
      users,
      blackListUsers,
      GameStats.create(stats),
      createdAt,
      updatedAt,
    );
  }

  // Getters
  get id(): string | null {
    return this._id;
  }

  get number(): string {
    return this._number;
  }

  get status(): GameStatus {
    return this._status;
  }

  get typeGame(): GameType {
    return this._typeGame;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get question(): string {
    return this._question;
  }

  get usedQuestions(): string[] {
    return [...this._usedQuestions];
  }

  get currentRound(): number {
    return this._currentRound;
  }

  get maxRounds(): number {
    return this._maxRounds;
  }

  get gamesCount(): number {
    return this._gamesCount;
  }

  get users(): string[] {
    return [...this._users];
  }

  get blackListUsers(): string[] {
    return [...this._blackListUsers];
  }

  get stats(): GameStats {
    return this._stats;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Business logic methods
  updateQuestion(question: string, questionId: string): void {
    this._question = question;
    this._usedQuestions = [...this._usedQuestions, questionId];
  }

  incrementRound(): void {
    if (this._currentRound >= this._maxRounds) {
      throw new Error('Cannot increment round: maximum rounds reached');
    }
    this._currentRound += 1;
    this.addDomainEvent(
      new RoundIncrementedEvent(this._id || '', this._currentRound),
    );
  }

  incrementGamesCount(): void {
    this._gamesCount += 1;
  }

  updateStats(userScores: Record<string, number>): void {
    this._stats = this._stats.addScores(userScores);
  }

  finishGame(userScores: Record<string, number>): void {
    this._stats = this._stats.setScores(userScores);
    this._status = GameStatus.finish();
    this.addDomainEvent(
      new GameFinishedEvent(this._id || '', this._stats.toRecord()),
    );
  }

  addUser(userId: string): void {
    if (this._blackListUsers.includes(userId)) {
      throw new Error('User is blacklisted and cannot be added to the game');
    }

    if (!this._users.includes(userId)) {
      this._users = [...this._users, userId];
    }
  }

  isActive(): boolean {
    return this._status.isActive();
  }

  isFinished(): boolean {
    return this._status.isFinished();
  }

  isDisabled(): boolean {
    return this._status.isDisabled();
  }

  // Domain events
  private addDomainEvent(
    event: GameCreatedEvent | GameFinishedEvent | RoundIncrementedEvent,
  ): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): Array<
    GameCreatedEvent | GameFinishedEvent | RoundIncrementedEvent
  > {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
