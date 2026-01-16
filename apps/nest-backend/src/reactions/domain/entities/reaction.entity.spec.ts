import { Reaction } from './reaction.entity';

describe('Reaction Entity', () => {
  describe('create', () => {
    it('should create a reaction', () => {
      const reaction = Reaction.create(
        'answer1',
        'user1',
        'reaction1',
        'game1',
      );
      expect(reaction.answerId).toBe('answer1');
      expect(reaction.userId).toBe('user1');
      expect(reaction.reactionId).toBe('reaction1');
      expect(reaction.gameId).toBe('game1');
    });

    it('should create a reaction without gameId', () => {
      const reaction = Reaction.create('answer1', 'user1', 'reaction1');
      expect(reaction.gameId).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute reaction from persistence', () => {
      const reaction = Reaction.reconstitute(
        'id1',
        'answer1',
        'user1',
        'reaction1',
        'game1',
        new Date('2024-01-01'),
      );
      expect(reaction.id).toBe('id1');
      expect(reaction.answerId).toBe('answer1');
    });
  });
});
