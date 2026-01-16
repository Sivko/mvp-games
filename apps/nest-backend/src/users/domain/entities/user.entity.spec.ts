import { User } from './user.entity';
import { TelegramUser } from '../value-objects/telegram-user.vo';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user without telegram', () => {
      const user = User.create('John Doe');
      expect(user.name).toBe('John Doe');
      expect(user.hasTelegram()).toBe(false);
    });

    it('should create a user with telegram', () => {
      const telegramUser = TelegramUser.create(
        12345,
        'username',
        'John',
        'Doe',
      );
      const user = User.create('John Doe', telegramUser);
      expect(user.name).toBe('John Doe');
      expect(user.hasTelegram()).toBe(true);
      expect(user.telegramUser?.getTelegramId()).toBe(12345);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from persistence', () => {
      const user = User.reconstitute(
        'id1',
        'John Doe',
        12345,
        'username',
        'John',
        'Doe',
        undefined,
        'en',
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(user.id).toBe('id1');
      expect(user.name).toBe('John Doe');
      expect(user.hasTelegram()).toBe(true);
    });
  });
});
