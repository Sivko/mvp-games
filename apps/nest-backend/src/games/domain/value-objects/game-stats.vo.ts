export class GameStats {
  private constructor(private readonly scores: Map<string, number>) {
    this.scores = new Map(scores);
  }

  static create(scores: Map<string, number> = new Map()): GameStats {
    return new GameStats(scores);
  }

  static fromRecord(record: Record<string, number>): GameStats {
    const map = new Map<string, number>();
    Object.entries(record).forEach(([userId, score]) => {
      map.set(userId, score);
    });
    return new GameStats(map);
  }

  addScores(userScores: Record<string, number>): GameStats {
    const newScores = new Map(this.scores);
    Object.entries(userScores).forEach(([userId, score]) => {
      const currentScore = newScores.get(userId) || 0;
      newScores.set(userId, currentScore + score);
    });
    return new GameStats(newScores);
  }

  setScores(userScores: Record<string, number>): GameStats {
    const newScores = new Map<string, number>();
    Object.entries(userScores).forEach(([userId, score]) => {
      newScores.set(userId, score);
    });
    return new GameStats(newScores);
  }

  getScore(userId: string): number {
    return this.scores.get(userId) || 0;
  }

  getAllScores(): Map<string, number> {
    return new Map(this.scores);
  }

  toRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    this.scores.forEach((score, userId) => {
      record[userId] = score;
    });
    return record;
  }

  isEmpty(): boolean {
    return this.scores.size === 0;
  }
}
