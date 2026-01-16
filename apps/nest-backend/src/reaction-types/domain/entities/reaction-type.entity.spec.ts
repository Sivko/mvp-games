import { ReactionType } from './reaction-type.entity';

describe('ReactionType Entity', () => {
  describe('create', () => {
    it('should create a reaction type', () => {
      const reactionType = ReactionType.create(
        'Like',
        'You liked this',
        'image.png',
      );
      expect(reactionType.name).toBe('Like');
      expect(reactionType.textFromFinalRound).toBe('You liked this');
      expect(reactionType.image).toBe('image.png');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute reaction type from persistence', () => {
      const reactionType = ReactionType.reconstitute(
        'id1',
        'Like',
        'You liked this',
        'image.png',
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(reactionType.id).toBe('id1');
      expect(reactionType.name).toBe('Like');
    });
  });
});
