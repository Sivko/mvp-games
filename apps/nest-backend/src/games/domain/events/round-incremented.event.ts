export class RoundIncrementedEvent {
  constructor(
    public readonly gameId: string,
    public readonly currentRound: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
