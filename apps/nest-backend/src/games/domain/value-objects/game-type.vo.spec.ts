import { GameType } from './game-type.vo';

describe('GameType', () => {
  describe('create', () => {
    it('should create a valid game type', () => {
      const gameType = GameType.create('association-text');
      expect(gameType.getValue()).toBe('association-text');
    });

    it('should throw error for empty type', () => {
      expect(() => GameType.create('')).toThrow('Game type cannot be empty');
      expect(() => GameType.create('   ')).toThrow('Game type cannot be empty');
    });
  });

  describe('isAssociationText', () => {
    it('should return true for association-text type', () => {
      const gameType = GameType.create('association-text');
      expect(gameType.isAssociationText()).toBe(true);
    });

    it('should return false for other types', () => {
      const gameType = GameType.create('other-type');
      expect(gameType.isAssociationText()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal types', () => {
      const type1 = GameType.create('association-text');
      const type2 = GameType.create('association-text');
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = GameType.create('association-text');
      const type2 = GameType.create('other-type');
      expect(type1.equals(type2)).toBe(false);
    });
  });
});
