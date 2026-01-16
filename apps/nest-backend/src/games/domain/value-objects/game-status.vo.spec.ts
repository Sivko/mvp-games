import { GameStatus, GameStatusEnum } from './game-status.vo';

describe('GameStatus', () => {
  describe('create', () => {
    it('should create a valid game status', () => {
      const status = GameStatus.create('active');
      expect(status.getValue()).toBe('active');
    });

    it('should throw error for invalid status', () => {
      expect(() => GameStatus.create('invalid')).toThrow(
        'Invalid game status: invalid',
      );
    });
  });

  describe('static factory methods', () => {
    it('should create active status', () => {
      const status = GameStatus.active();
      expect(status.getValue()).toBe(GameStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
    });

    it('should create waiting status', () => {
      const status = GameStatus.waiting();
      expect(status.getValue()).toBe(GameStatusEnum.WAITING);
      expect(status.isActive()).toBe(true);
    });

    it('should create finish status', () => {
      const status = GameStatus.finish();
      expect(status.getValue()).toBe(GameStatusEnum.FINISH);
      expect(status.isFinished()).toBe(true);
    });

    it('should create disabled status', () => {
      const status = GameStatus.disabled();
      expect(status.getValue()).toBe(GameStatusEnum.DISABLED);
      expect(status.isDisabled()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return true for active status', () => {
      expect(GameStatus.active().isActive()).toBe(true);
      expect(GameStatus.waiting().isActive()).toBe(true);
    });

    it('should return false for non-active status', () => {
      expect(GameStatus.finish().isActive()).toBe(false);
      expect(GameStatus.disabled().isActive()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal statuses', () => {
      const status1 = GameStatus.active();
      const status2 = GameStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = GameStatus.active();
      const status2 = GameStatus.finish();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
