import { Answer } from './answer.entity';
import { AnswerStats } from '../value-objects/answer-stats.vo';

describe('Answer Entity', () => {
  describe('create', () => {
    it('should create a new answer', () => {
      const answer = Answer.create('Test answer', 'game1', 'user1', 'bank1');
      expect(answer.text).toBe('Test answer');
      expect(answer.gameId).toBe('game1');
      expect(answer.userId).toBe('user1');
      expect(answer.bankAssociationTextId).toBe('bank1');
      expect(answer.score).toBe(0);
      expect(answer.similarity).toBe(0);
    });
  });

  describe('updateText', () => {
    it('should update text', () => {
      const answer = Answer.create('Old text');
      answer.updateText('New text');
      expect(answer.text).toBe('New text');
    });
  });

  describe('updateScore', () => {
    it('should update score', () => {
      const answer = Answer.create('Test');
      answer.updateScore(100);
      expect(answer.score).toBe(100);
    });
  });

  describe('incrementReactions', () => {
    it('should increment reactions', () => {
      const answer = Answer.create('Test');
      answer.incrementReactions();
      expect(answer.stats.getTotalReactions()).toBe(1);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute answer from persistence', () => {
      const answer = Answer.reconstitute(
        'id1',
        'game1',
        'user1',
        'Test answer',
        0.5,
        { totalReactions: 10, uniqueUsersReacted: 5 },
        100,
        'bank1',
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(answer.id).toBe('id1');
      expect(answer.text).toBe('Test answer');
      expect(answer.stats.getTotalReactions()).toBe(10);
    });
  });
});
