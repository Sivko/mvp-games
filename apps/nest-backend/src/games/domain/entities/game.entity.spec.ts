import { Game } from './game.entity';
import { GameStatus } from '../value-objects/game-status.vo';
import { GameStats } from '../value-objects/game-stats.vo';

describe('Game Entity', () => {
  describe('create', () => {
    it('should create a new game', () => {
      const game = Game.create(
        'association-text',
        'user1',
        'Question?',
        [],
        10,
        '1',
      );
      expect(game.typeGame.getValue()).toBe('association-text');
      expect(game.createdBy).toBe('user1');
      expect(game.question).toBe('Question?');
      expect(game.currentRound).toBe(1);
      expect(game.maxRounds).toBe(10);
      expect(game.status.isActive()).toBe(true);
    });

    it('should emit GameCreatedEvent', () => {
      const game = Game.create('association-text', 'user1');
      const events = game.getDomainEvents();
      expect(events.length).toBe(1);
      const event = events[0] as any;
      expect(event.typeGame).toBe('association-text');
      expect(event.createdBy).toBe('user1');
    });
  });

  describe('updateQuestion', () => {
    it('should update question and add to usedQuestions', () => {
      const game = Game.create('association-text', 'user1');
      game.updateQuestion('New Question', 'question-id-1');
      expect(game.question).toBe('New Question');
      expect(game.usedQuestions).toContain('question-id-1');
    });
  });

  describe('incrementRound', () => {
    it('should increment current round', () => {
      const game = Game.create('association-text', 'user1', '', [], 10);
      game.incrementRound();
      expect(game.currentRound).toBe(2);
    });

    it('should emit RoundIncrementedEvent', () => {
      const game = Game.create('association-text', 'user1', '', [], 10);
      game.clearDomainEvents();
      game.incrementRound();
      const events = game.getDomainEvents();
      expect(events.length).toBe(1);
      const event = events[0] as any;
      expect(event.currentRound).toBe(2);
    });

    it('should throw error when max rounds reached', () => {
      const game = Game.create('association-text', 'user1', '', [], 2);
      game.incrementRound(); // currentRound becomes 2, which equals maxRounds
      expect(() => game.incrementRound()).toThrow(
        'Cannot increment round: maximum rounds reached',
      );
    });

    it('should throw error immediately when currentRound equals maxRounds', () => {
      const game = Game.create('association-text', 'user1', '', [], 1);
      // currentRound is 1, maxRounds is 1, so incrementRound should throw immediately
      expect(() => game.incrementRound()).toThrow(
        'Cannot increment round: maximum rounds reached',
      );
    });
  });

  describe('incrementGamesCount', () => {
    it('should increment games count', () => {
      const game = Game.create('association-text', 'user1');
      expect(game.gamesCount).toBe(0);
      game.incrementGamesCount();
      expect(game.gamesCount).toBe(1);
    });
  });

  describe('updateStats', () => {
    it('should add scores to existing stats', () => {
      const game = Game.create('association-text', 'user1');
      game.updateStats({ user1: 10, user2: 20 });
      expect(game.stats.getScore('user1')).toBe(10);
      expect(game.stats.getScore('user2')).toBe(20);

      game.updateStats({ user1: 5 });
      expect(game.stats.getScore('user1')).toBe(15);
    });
  });

  describe('finishGame', () => {
    it('should set status to finish and update stats', () => {
      const game = Game.create('association-text', 'user1');
      game.finishGame({ user1: 100, user2: 50 });
      expect(game.isFinished()).toBe(true);
      expect(game.stats.getScore('user1')).toBe(100);
      expect(game.stats.getScore('user2')).toBe(50);
    });

    it('should emit GameFinishedEvent', () => {
      const game = Game.create('association-text', 'user1');
      game.clearDomainEvents();
      game.finishGame({ user1: 100 });
      const events = game.getDomainEvents();
      expect(events.length).toBe(1);
      const event = events[0] as any;
      expect(event.stats).toEqual({ user1: 100 });
    });
  });

  describe('addUser', () => {
    it('should add user to game', () => {
      const game = Game.create('association-text', 'user1');
      game.addUser('user2');
      expect(game.users).toContain('user2');
    });

    it('should not add duplicate user', () => {
      const game = Game.create('association-text', 'user1');
      game.addUser('user2');
      game.addUser('user2');
      expect(game.users.filter((u) => u === 'user2').length).toBe(1);
    });

    it('should throw error for blacklisted user', () => {
      const game = Game.reconstitute(
        'id1',
        '1',
        'active',
        'association-text',
        'user1',
        '',
        [],
        1,
        10,
        0,
        [],
        ['user2'],
        new Map(),
      );
      expect(() => game.addUser('user2')).toThrow(
        'User is blacklisted and cannot be added to the game',
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute game from persistence', () => {
      const stats = new Map<string, number>();
      stats.set('user1', 10);
      const game = Game.reconstitute(
        'id1',
        '1',
        'active',
        'association-text',
        'user1',
        'Question?',
        ['q1'],
        2,
        10,
        1,
        ['user2'],
        [],
        stats,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      expect(game.id).toBe('id1');
      expect(game.number).toBe('1');
      expect(game.currentRound).toBe(2);
      expect(game.stats.getScore('user1')).toBe(10);
    });
  });
});
