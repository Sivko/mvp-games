import { AnswerStats } from './answer-stats.vo';

describe('AnswerStats', () => {
  describe('create', () => {
    it('should create stats with default values', () => {
      const stats = AnswerStats.create();
      expect(stats.getTotalReactions()).toBe(0);
      expect(stats.getUniqueUsersReacted()).toBe(0);
    });

    it('should create stats with initial values', () => {
      const stats = AnswerStats.create(10, 5);
      expect(stats.getTotalReactions()).toBe(10);
      expect(stats.getUniqueUsersReacted()).toBe(5);
    });
  });

  describe('incrementReactions', () => {
    it('should increment total reactions', () => {
      const stats = AnswerStats.create(5, 3);
      const updated = stats.incrementReactions();
      expect(updated.getTotalReactions()).toBe(6);
      expect(updated.getUniqueUsersReacted()).toBe(3);
    });

    it('should not mutate original', () => {
      const stats = AnswerStats.create(5, 3);
      stats.incrementReactions();
      expect(stats.getTotalReactions()).toBe(5);
    });
  });

  describe('incrementUniqueUsers', () => {
    it('should increment unique users', () => {
      const stats = AnswerStats.create(5, 3);
      const updated = stats.incrementUniqueUsers();
      expect(updated.getUniqueUsersReacted()).toBe(4);
      expect(updated.getTotalReactions()).toBe(5);
    });
  });

  describe('toObject', () => {
    it('should convert to object', () => {
      const stats = AnswerStats.create(10, 5);
      const obj = stats.toObject();
      expect(obj).toEqual({ totalReactions: 10, uniqueUsersReacted: 5 });
    });
  });
});
