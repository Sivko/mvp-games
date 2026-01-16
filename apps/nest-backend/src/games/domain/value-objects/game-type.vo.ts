export class GameType {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Game type cannot be empty');
    }
  }

  static create(value: string): GameType {
    return new GameType(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GameType): boolean {
    return this.value === other.value;
  }

  isAssociationText(): boolean {
    return this.value === 'association-text';
  }
}
