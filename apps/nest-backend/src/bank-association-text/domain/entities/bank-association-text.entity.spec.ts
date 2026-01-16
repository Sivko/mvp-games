import { BankAssociationText } from './bank-association-text.entity';

describe('BankAssociationText Entity', () => {
  describe('create', () => {
    it('should create a bank association text', () => {
      const entity = BankAssociationText.create('What is love?');
      expect(entity.question).toBe('What is love?');
      expect(entity.status).toBe(true);
      expect(entity.isActive()).toBe(true);
    });

    it('should create with custom status', () => {
      const entity = BankAssociationText.create('Question?', false);
      expect(entity.status).toBe(false);
      expect(entity.isActive()).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const entity = BankAssociationText.reconstitute(
        'id1',
        'What is love?',
        true,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(entity.id).toBe('id1');
      expect(entity.question).toBe('What is love?');
    });
  });
});
