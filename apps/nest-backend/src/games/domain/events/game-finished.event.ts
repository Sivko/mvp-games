export class GameFinishedEvent {
  constructor(
    public readonly gameId: string,
    public readonly stats: Record<string, number>,
    public readonly timestamp: Date = new Date(),
  ) {}
}
