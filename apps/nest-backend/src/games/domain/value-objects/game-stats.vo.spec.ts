import { GameStats } from './game-stats.vo';

describe('GameStats', () => {
  describe('create', () => {
    it('should create empty stats', () => {
      const stats = GameStats.create();
      expect(stats.isEmpty()).toBe(true);
      expect(stats.getAllScores().size).toBe(0);
    });

    it('should create stats with initial scores', () => {
      const scores = new Map<string, number>();
      scores.set('user1', 10);
      scores.set('user2', 20);
      const stats = GameStats.create(scores);
      expect(stats.getScore('user1')).toBe(10);
      expect(stats.getScore('user2')).toBe(20);
    });
  });

  describe('fromRecord', () => {
    it('should create stats from record', () => {
      const record = { user1: 10, user2: 20 };
      const stats = GameStats.fromRecord(record);
      expect(stats.getScore('user1')).toBe(10);
      expect(stats.getScore('user2')).toBe(20);
    });
  });

  describe('addScores', () => {
    it('should add new scores to existing ones', () => {
      const stats = GameStats.fromRecord({ user1: 10, user2: 20 });
      const updated = stats.addScores({ user1: 5, user3: 15 });
      expect(updated.getScore('user1')).toBe(15);
      expect(updated.getScore('user2')).toBe(20);
      expect(updated.getScore('user3')).toBe(15);
    });

    it('should not mutate original stats', () => {
      const stats = GameStats.fromRecord({ user1: 10 });
      stats.addScores({ user1: 5 });
      expect(stats.getScore('user1')).toBe(10);
    });
  });

  describe('setScores', () => {
    it('should replace all scores', () => {
      const stats = GameStats.fromRecord({ user1: 10, user2: 20 });
      const updated = stats.setScores({ user1: 5, user3: 15 });
      expect(updated.getScore('user1')).toBe(5);
      expect(updated.getScore('user2')).toBe(0);
      expect(updated.getScore('user3')).toBe(15);
    });
  });

  describe('getScore', () => {
    it('should return 0 for non-existent user', () => {
      const stats = GameStats.create();
      expect(stats.getScore('user1')).toBe(0);
    });
  });

  describe('toRecord', () => {
    it('should convert to record', () => {
      const stats = GameStats.fromRecord({ user1: 10, user2: 20 });
      const record = stats.toRecord();
      expect(record).toEqual({ user1: 10, user2: 20 });
    });
  });
});
