export class AnswerStats {
  private constructor(
    private readonly totalReactions: number,
    private readonly uniqueUsersReacted: number,
  ) {}

  static create(
    totalReactions: number = 0,
    uniqueUsersReacted: number = 0,
  ): AnswerStats {
    return new AnswerStats(totalReactions, uniqueUsersReacted);
  }

  incrementReactions(): AnswerStats {
    return new AnswerStats(this.totalReactions + 1, this.uniqueUsersReacted);
  }

  incrementUniqueUsers(): AnswerStats {
    return new AnswerStats(this.totalReactions, this.uniqueUsersReacted + 1);
  }

  getTotalReactions(): number {
    return this.totalReactions;
  }

  getUniqueUsersReacted(): number {
    return this.uniqueUsersReacted;
  }

  toObject(): { totalReactions: number; uniqueUsersReacted: number } {
    return {
      totalReactions: this.totalReactions,
      uniqueUsersReacted: this.uniqueUsersReacted,
    };
  }
}
