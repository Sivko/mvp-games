export enum GameStatusEnum {
  ACTIVE = 'active',
  WAITING = 'waiting',
  FINISH = 'finish',
  DISABLED = 'disabled',
}

export class GameStatus {
  private constructor(private readonly value: GameStatusEnum) {
    if (!Object.values(GameStatusEnum).includes(value)) {
      throw new Error(`Invalid game status: ${value}`);
    }
  }

  static create(value: string): GameStatus {
    return new GameStatus(value as GameStatusEnum);
  }

  static active(): GameStatus {
    return new GameStatus(GameStatusEnum.ACTIVE);
  }

  static waiting(): GameStatus {
    return new GameStatus(GameStatusEnum.WAITING);
  }

  static finish(): GameStatus {
    return new GameStatus(GameStatusEnum.FINISH);
  }

  static disabled(): GameStatus {
    return new GameStatus(GameStatusEnum.DISABLED);
  }

  getValue(): string {
    return this.value;
  }

  isActive(): boolean {
    return (
      this.value === GameStatusEnum.ACTIVE ||
      this.value === GameStatusEnum.WAITING
    );
  }

  isFinished(): boolean {
    return this.value === GameStatusEnum.FINISH;
  }

  isDisabled(): boolean {
    return this.value === GameStatusEnum.DISABLED;
  }

  equals(other: GameStatus): boolean {
    return this.value === other.value;
  }
}
