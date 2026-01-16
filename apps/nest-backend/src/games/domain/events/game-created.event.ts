export class GameCreatedEvent {
  constructor(
    public readonly gameId: string,
    public readonly typeGame: string,
    public readonly createdBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
