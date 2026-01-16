import { Injectable } from '@nestjs/common';
import { AnswerApplicationService } from '../../../answers/application/services/answer.application.service';
import { ReactionApplicationService } from '../../../reactions/application/services/reaction.application.service';
import { GameApplicationService } from './game.application.service';
import { UserApplicationService } from '../../../users/application/services/user.application.service';
import { ElasticsearchService } from '../../../elasticsearch/elasticsearch.service';
import {
  GameRoom,
  GameRoomState,
  AnswerWithUserName,
  PlayerInfo,
} from '../types/game-room.types';
import { GameResponseDto } from '../dto/game-response.dto';

export interface SubmitAnswerResult {
  answerId: string;
  shouldUpdateScores: boolean;
  userScores?: Record<string, number>;
  shouldEmitReadyUpdate: boolean;
  readyUpdate?: {
    readyCount: number;
    totalUsers: number;
    readyUsers: string[];
  };
  shouldSwitchToResults: boolean;
  actionMessage?: string;
}

export interface SubmitReactionResult {
  reactions: Array<{
    id: string;
    userId: string;
    reactionId: string;
  }>;
  actionMessage?: string;
}

@Injectable()
export class GameSessionService {
  private gameRooms = new Map<string, GameRoom>();
  private readonly TIMER_DURATION = 10000; // 10 секунд

  constructor(
    private readonly answerApplicationService: AnswerApplicationService,
    private readonly reactionApplicationService: ReactionApplicationService,
    private readonly gameApplicationService: GameApplicationService,
    private readonly userApplicationService: UserApplicationService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  /**
   * Инициализирует комнату игры, если её еще нет
   */
  async initializeRoom(
    gameId: string,
    game?: GameResponseDto,
  ): Promise<GameRoom> {
    if (this.gameRooms.has(gameId)) {
      return this.gameRooms.get(gameId)!;
    }

    // Загружаем игру, если не передана
    const gameData =
      game || (await this.gameApplicationService.findById(gameId));
    const userScores = new Map<string, number>();

    // Загружаем очки из game.stats, если они есть
    if (gameData?.stats) {
      Object.entries(gameData.stats).forEach(([userId, score]) => {
        userScores.set(userId, score);
      });
    }

    const room: GameRoom = {
      gameId,
      users: new Map(),
      uniqueUserIds: new Set(),
      phase: 'input',
      timer: null,
      timerEndsAt: null,
      readyUsers: new Set(),
      userScores,
    };

    this.gameRooms.set(gameId, room);
    return room;
  }

  /**
   * Добавляет пользователя в комнату
   */
  async addUserToRoom(
    gameId: string,
    userId: string,
    socketId: string,
  ): Promise<{ isNewUser: boolean; room: GameRoom }> {
    const room = await this.initializeRoom(gameId);
    const isNewUser = !room.uniqueUserIds.has(userId);

    room.users.set(socketId, { userId, socketId });
    room.uniqueUserIds.add(userId);

    // Добавляем пользователя в массив users игры в базе данных
    await this.gameApplicationService.addUserToGame(gameId, userId);

    return { isNewUser, room };
  }

  /**
   * Удаляет пользователя из комнаты
   */
  removeUserFromRoom(
    gameId: string,
    socketId: string,
  ): {
    userId: string | null;
    room: GameRoom | null;
  } {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return { userId: null, room: null };
    }

    const userInfo = room.users.get(socketId);
    if (!userInfo) {
      return { userId: null, room };
    }

    room.users.delete(socketId);

    // Проверяем, остались ли еще соединения для этого userId
    const hasOtherConnections = Array.from(room.users.values()).some(
      (u) => u.userId === userInfo.userId,
    );

    // Если больше нет соединений для этого userId, удаляем его из уникальных пользователей
    if (!hasOtherConnections) {
      room.uniqueUserIds.delete(userInfo.userId);
    }

    return { userId: userInfo.userId, room };
  }

  /**
   * Получает комнату по gameId
   */
  getRoom(gameId: string): GameRoom | null {
    return this.gameRooms.get(gameId) || null;
  }

  /**
   * Получает текущее состояние комнаты для отправки клиенту
   */
  async getRoomState(gameId: string): Promise<GameRoomState | null> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return null;
    }

    const game = await this.gameApplicationService.findById(gameId);
    const currentRound = game?.currentRound || 1;
    const maxRounds = game?.maxRounds || 10;

    // Преобразуем Map очков в объект
    const userScoresObject: Record<string, number> = {};
    room.userScores.forEach((score, userId) => {
      userScoresObject[userId] = score;
    });

    const baseState: GameRoomState = {
      phase: room.phase,
      onlineUsersCount: room.uniqueUserIds.size,
      timerEndsAt: room.timerEndsAt,
      readyCount: room.readyUsers.size,
      readyUsers: Array.from(room.readyUsers),
      userScores: userScoresObject,
      currentRound,
      maxRounds,
    };

    // Если фаза results, загружаем ответы
    if (room.phase === 'results') {
      const answers = await this.answerApplicationService.findByGameId(gameId);
      const answersWithUserNames =
        await this.enrichAnswersWithUserNames(answers);
      baseState.answers = answersWithUserNames;
    }

    // Если фаза finish, загружаем информацию об игроках
    if (room.phase === 'finish') {
      const players = await this.getPlayersInfo(
        Array.from(room.userScores.keys()),
      );
      baseState.players = players;
      baseState.isGameFinished = currentRound >= maxRounds;
    }

    // Если фаза input, добавляем вопрос
    if (room.phase === 'input') {
      baseState.question = game?.question || '';
    }

    return baseState;
  }

  /**
   * Обогащает ответы именами пользователей
   */
  private async enrichAnswersWithUserNames(
    answers: any[],
  ): Promise<AnswerWithUserName[]> {
    return Promise.all(
      answers.map(async (a) => {
        const user = a.userId
          ? await this.userApplicationService.findById(a.userId)
          : null;
        const userName =
          user?.name ||
          user?.telegramFirstName ||
          user?.telegramUsername ||
          'Неизвестный';
        return {
          id: a._id,
          userId: a.userId || '',
          text: a.text,
          userName,
          score: a.score || 0,
        };
      }),
    );
  }

  /**
   * Получает информацию об игроках
   */
  async getPlayersInfo(userIds: string[]): Promise<PlayerInfo[]> {
    return Promise.all(
      userIds.map(async (userId) => {
        const user = await this.userApplicationService.findById(userId);
        const userName =
          user?.name ||
          user?.telegramFirstName ||
          user?.telegramUsername ||
          'Неизвестный';
        return {
          userId,
          userName,
          initial: userName.charAt(0).toUpperCase(),
          telegramPhotoUrl: user?.telegramPhotoUrl,
        };
      }),
    );
  }

  /**
   * Обновляет очки пользователя в комнате
   */
  async updateUserScore(
    gameId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    room.userScores.set(userId, score);
  }

  /**
   * Пересчитывает очки всех пользователей из ответов текущего раунда
   */
  async recalculateScoresFromAnswers(gameId: string): Promise<void> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    const answers = await this.answerApplicationService.findByGameId(gameId);
    const userScoresMap = new Map<string, number>();

    answers.forEach((a) => {
      const userId = a.userId;
      if (userId) {
        const currentScore = userScoresMap.get(userId) || 0;
        userScoresMap.set(userId, currentScore + (a.score || 0));
      }
    });

    // Получаем игру для получения очков из предыдущих раундов
    const game = await this.gameApplicationService.findById(gameId);

    // Обновляем очки в комнате, суммируя очки из предыдущих раундов и текущего раунда
    userScoresMap.forEach((currentRoundScore, userId) => {
      const previousRoundsScore = game?.stats?.[userId] || 0;
      const totalScore = previousRoundsScore + currentRoundScore;
      room.userScores.set(userId, totalScore);
    });

    // Также добавляем пользователей, которые есть в game.stats, но нет в текущих ответах
    if (game?.stats) {
      Object.entries(game.stats).forEach(([userId, previousScore]) => {
        if (!userScoresMap.has(userId)) {
          room.userScores.set(userId, previousScore);
        }
      });
    }
  }

  /**
   * Добавляет пользователя в список готовых
   */
  markUserReady(gameId: string, userId: string): void {
    const room = this.gameRooms.get(gameId);
    if (room) {
      room.readyUsers.add(userId);
    }
  }

  /**
   * Проверяет, готово ли больше половины пользователей
   */
  isMoreThanHalfReady(gameId: string): boolean {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return false;
    }

    const totalUsers = room.uniqueUserIds.size;
    const readyCount = room.readyUsers.size;
    const halfUsers = Math.ceil(totalUsers / 2);

    return readyCount > halfUsers;
  }

  /**
   * Проверяет, готовы ли все пользователи
   */
  areAllUsersReady(gameId: string): boolean {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return false;
    }

    return room.readyUsers.size >= room.uniqueUserIds.size;
  }

  /**
   * Переключает комнату на фазу results
   */
  async switchToResultsPhase(gameId: string): Promise<void> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    // Очищаем таймер фазы input
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Переключаемся на фазу results
    room.phase = 'results';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();
    room.timerEndsAt = null;

    // Пересчитываем очки из ответов
    await this.recalculateScoresFromAnswers(gameId);
  }

  /**
   * Переключает комнату на фазу finish
   */
  async switchToFinishPhase(gameId: string): Promise<void> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    // Очищаем таймер фазы results
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Переключаемся на фазу finish
    room.phase = 'finish';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();
    room.timerEndsAt = null;
  }

  /**
   * Начинает новый раунд
   */
  async startNewRound(gameId: string): Promise<void> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    // Очищаем таймер
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Получаем игру для проверки раундов
    const game = await this.gameApplicationService.findById(gameId);
    if (!game) {
      return;
    }

    const currentRound = game.currentRound || 1;
    const maxRounds = game.maxRounds || 10;

    // Вычисляем очки текущего раунда из ответов перед их удалением
    const answers = await this.answerApplicationService.findByGameId(gameId);
    const currentRoundScores: Record<string, number> = {};

    answers.forEach((a) => {
      const userId = a.userId;
      if (userId) {
        const currentScore = currentRoundScores[userId] || 0;
        currentRoundScores[userId] = currentScore + (a.score || 0);
      }
    });

    // Сохраняем очки текущего раунда в game.stats перед удалением ответов
    if (Object.keys(currentRoundScores).length > 0) {
      await this.gameApplicationService.updateStats(gameId, {
        userScores: currentRoundScores,
      });
    }

    // Загружаем очки из game.stats обратно в room.userScores для нового раунда
    room.userScores.clear();
    const updatedGame = await this.gameApplicationService.findById(gameId);
    if (updatedGame?.stats) {
      Object.entries(updatedGame.stats).forEach(([userId, score]) => {
        room.userScores.set(userId, score);
      });
    }

    // Если текущий раунд уже равен или больше максимального, сбрасываем счетчик раундов к 1
    if (currentRound >= maxRounds) {
      // Увеличиваем счетчик завершенных игр (циклов раундов)
      await this.gameApplicationService.incrementGamesCount(gameId);
      // Очищаем статистику очков для нового цикла раундов
      await this.gameApplicationService.updateStats(gameId, {
        userScores: {},
      });
      // Очищаем очки в комнате для нового цикла раундов
      room.userScores.clear();
    } else {
      // Увеличиваем раунд в базе данных
      await this.gameApplicationService.incrementRound(gameId);
    }

    // Обновляем вопрос в игре
    await this.gameApplicationService.updateQuestion(gameId);

    // Удаляем все ответы для этой игры
    await this.answerApplicationService.deleteByGameId(gameId);

    // Переключаемся обратно на фазу input
    room.phase = 'input';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();
    room.timerEndsAt = null;
  }

  /**
   * Запускает таймер для фазы input
   */
  startInputPhaseTimer(
    gameId: string,
    duration: number,
    callback: () => Promise<void>,
  ): void {
    const room = this.gameRooms.get(gameId);
    if (!room || room.timer) {
      return;
    }

    room.timerEndsAt = Date.now() + duration;
    room.timer = setTimeout(async () => {
      room.timer = null;
      await callback();
    }, duration);
  }

  /**
   * Запускает таймер для фазы results
   */
  startResultsPhaseTimer(
    gameId: string,
    duration: number,
    callback: () => Promise<void>,
  ): void {
    const room = this.gameRooms.get(gameId);
    if (!room || room.timer) {
      return;
    }

    room.timerEndsAt = Date.now() + duration;
    room.timer = setTimeout(async () => {
      room.timer = null;
      await callback();
    }, duration);
  }

  /**
   * Очищает таймер
   */
  clearTimer(gameId: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room || !room.timer) {
      return;
    }

    clearTimeout(room.timer);
    room.timer = null;
    room.timerEndsAt = null;
  }

  /**
   * Получает список всех онлайн игроков с их именами
   */
  async getOnlinePlayers(gameId: string): Promise<PlayerInfo[]> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return [];
    }

    return this.getPlayersInfo(Array.from(room.uniqueUserIds));
  }

  /**
   * Обрабатывает отправку ответа пользователем
   */
  async submitAnswer(
    gameId: string,
    userId: string,
    text: string,
  ): Promise<SubmitAnswerResult> {
    const room = this.gameRooms.get(gameId);
    if (!room || room.phase !== 'input') {
      throw new Error('Game room not found or not in input phase');
    }

    // Получаем игру для получения bankAssociationTextId
    const game = await this.gameApplicationService.findById(gameId);
    const bankAssociationTextId =
      game?.usedQuestions && game.usedQuestions.length > 0
        ? game.usedQuestions[game.usedQuestions.length - 1]
        : undefined;

    // Проверяем, не отправил ли пользователь уже ответ
    const existingAnswer =
      await this.answerApplicationService.findByGameIdAndUserId(gameId, userId);

    let answerId: string;
    if (existingAnswer) {
      // Обновляем существующий ответ
      await this.answerApplicationService.update(existingAnswer._id, {
        text,
      });
      answerId = existingAnswer._id;
    } else {
      // Создаем новый ответ
      const newAnswer = await this.answerApplicationService.create({
        gameId,
        userId,
        text,
        bankAssociationTextId,
      });
      answerId = newAnswer._id;
    }

    const result: SubmitAnswerResult = {
      answerId,
      shouldUpdateScores: false,
      shouldEmitReadyUpdate: false,
      shouldSwitchToResults: false,
    };

    // Вычисляем и сохраняем score, если есть bankAssociationTextId
    if (bankAssociationTextId) {
      try {
        await this.elasticsearchService.calculateScore(
          bankAssociationTextId.toString(),
          text,
          answerId,
        );

        // Пересчитываем очки пользователя из всех его ответов в текущем раунде
        const userAnswers =
          await this.answerApplicationService.findByGameId(gameId);
        const currentRoundScore = userAnswers
          .filter((a) => a.userId === userId)
          .reduce((sum, a) => sum + (a.score || 0), 0);

        // Получаем очки из предыдущих раундов из game.stats
        const gameForStats = await this.gameApplicationService.findById(gameId);
        const previousRoundsScore = gameForStats?.stats?.[userId] || 0;

        // Суммируем очки из предыдущих раундов и текущего раунда
        const userTotalScore = previousRoundsScore + currentRoundScore;

        // Обновляем очки пользователя в комнате
        await this.updateUserScore(gameId, userId, userTotalScore);

        // Получаем обновленные очки для отправки
        const roomState = await this.getRoomState(gameId);
        if (roomState) {
          result.shouldUpdateScores = true;
          result.userScores = roomState.userScores;
        }
      } catch (error) {
        console.error('Failed to calculate score:', error);
        // Продолжаем выполнение даже если не удалось вычислить score
      }
    }

    // Получаем сообщение о действии
    const actionMessage = await this.getActionMessage(userId, 'добавил слово');
    if (actionMessage) {
      result.actionMessage = actionMessage;
    }

    // Добавляем пользователя в готовые
    this.markUserReady(gameId, userId);

    // Получаем обновленное состояние для отправки
    const roomState = await this.getRoomState(gameId);
    if (roomState) {
      result.shouldEmitReadyUpdate = true;
      result.readyUpdate = {
        readyCount: roomState.readyCount,
        totalUsers: roomState.onlineUsersCount,
        readyUsers: roomState.readyUsers,
      };
    }

    // Если все пользователи отправили ответы, нужно переключиться на results
    if (this.areAllUsersReady(gameId)) {
      result.shouldSwitchToResults = true;
    }

    return result;
  }

  /**
   * Обрабатывает отправку реакции пользователем
   */
  async submitReaction(
    gameId: string,
    userId: string,
    answerId: string,
    reactionId: string,
  ): Promise<SubmitReactionResult> {
    const room = this.gameRooms.get(gameId);
    if (!room || room.phase !== 'results') {
      throw new Error('Game room not found or not in results phase');
    }

    // Проверяем, не отправил ли пользователь уже эту реакцию
    const existingReactions =
      await this.reactionApplicationService.findByAnswerAndUser(
        answerId,
        userId,
      );

    const hasReaction = existingReactions.some(
      (r) => r.reactionId === reactionId,
    );

    if (!hasReaction) {
      // Создаем реакцию с gameId
      await this.reactionApplicationService.create({
        answerId,
        userId,
        reactionId,
        gameId,
      });
      const actionMessage = await this.getActionMessage(
        userId,
        'поставил реакцию',
      );
      // Отправляем обновленные реакции для этого ответа
      const reactions =
        await this.reactionApplicationService.findByAnswerId(answerId);
      return {
        reactions: reactions.map((r) => ({
          id: r._id,
          userId: r.userId,
          reactionId: r.reactionId,
        })),
        actionMessage,
      };
    } else {
      // Удаляем реакцию (toggle)
      await this.reactionApplicationService.deleteByAnswerAndUserAndReaction(
        answerId,
        userId,
        reactionId,
      );
      const actionMessage = await this.getActionMessage(
        userId,
        'убрал реакцию',
      );
      // Отправляем обновленные реакции для этого ответа
      const reactions =
        await this.reactionApplicationService.findByAnswerId(answerId);
      return {
        reactions: reactions.map((r) => ({
          id: r._id,
          userId: r.userId,
          reactionId: r.reactionId,
        })),
        actionMessage,
      };
    }
  }

  /**
   * Получает реакции для всех ответов в фазе results
   */
  async getReactionsForAnswers(answerIds: string[]): Promise<
    Array<{
      answerId: string;
      reactions: Array<{
        id: string;
        userId: string;
        reactionId: string;
      }>;
    }>
  > {
    const reactionsByAnswer = await Promise.all(
      answerIds.map(async (answerId) => {
        const reactions =
          await this.reactionApplicationService.findByAnswerId(answerId);
        return {
          answerId,
          reactions: reactions.map((r) => ({
            id: r._id,
            userId: r.userId,
            reactionId: r.reactionId,
          })),
        };
      }),
    );

    return reactionsByAnswer;
  }

  /**
   * Получает сообщение о действии пользователя
   */
  async getActionMessage(
    userId: string,
    action: string,
  ): Promise<string | null> {
    try {
      const user = await this.userApplicationService.findById(userId);
      if (user) {
        const userName = user.name || user.telegramFirstName || 'Неизвестный';
        return `<strong>${userName}</strong> ${action}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting action message:', error);
      return null;
    }
  }

  /**
   * Получает количество онлайн пользователей
   */
  getOnlineUsersCount(gameId: string): number {
    const room = this.gameRooms.get(gameId);
    return room ? room.uniqueUserIds.size : 0;
  }

  /**
   * Получает длительность таймера
   */
  getTimerDuration(): number {
    return this.TIMER_DURATION;
  }

  /**
   * Обрабатывает переход к следующей фазе после отправки ответа
   */
  async handleAnswerSubmissionTransition(gameId: string): Promise<{
    shouldSwitch: boolean;
    newState?: GameRoomState;
    reactions?: Array<{
      answerId: string;
      reactions: Array<{
        id: string;
        userId: string;
        reactionId: string;
      }>;
    }>;
  }> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return { shouldSwitch: false };
    }

    // Если все пользователи отправили ответы, переключаемся на results
    if (this.areAllUsersReady(gameId)) {
      this.clearTimer(gameId);
      await this.switchToResultsPhase(gameId);
      const newState = await this.getRoomState(gameId);
      if (newState && newState.answers) {
        const reactions = await this.getReactionsForAnswers(
          newState.answers.map((a) => a.id),
        );
        return {
          shouldSwitch: true,
          newState,
          reactions,
        };
      }
      return {
        shouldSwitch: true,
        newState,
      };
    }

    // Если больше половины готовы и таймер не запущен, запускаем его
    if (this.isMoreThanHalfReady(gameId) && !room.timer) {
      this.startInputPhaseTimer(gameId, this.TIMER_DURATION, async () => {
        await this.switchToResultsPhase(gameId);
      });
      const updatedState = await this.getRoomState(gameId);
      return {
        shouldSwitch: false,
        newState: updatedState || undefined,
      };
    }

    return { shouldSwitch: false };
  }

  /**
   * Обрабатывает переход к следующей фазе после готовности к следующему раунду
   */
  async handleReadyForNextRoundTransition(gameId: string): Promise<{
    shouldSwitch: boolean;
    newState?: GameRoomState;
    shouldCheckNextRound?: boolean;
  }> {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return { shouldSwitch: false };
    }

    // Если все готовы и фаза results - проверяем, нужно ли показывать итоги раунда
    if (this.areAllUsersReady(gameId) && room.phase === 'results') {
      this.clearTimer(gameId);
      return {
        shouldSwitch: true,
        shouldCheckNextRound: true,
      };
    }

    // Если все готовы и фаза finish - переходим к новому раунду
    if (this.areAllUsersReady(gameId) && room.phase === 'finish') {
      this.clearTimer(gameId);
      await this.startNewRound(gameId);
      const newRoundState = await this.getRoomState(gameId);
      return {
        shouldSwitch: true,
        newState: newRoundState || undefined,
      };
    }

    // Если больше половины готовы и таймер не запущен, запускаем его
    if (this.isMoreThanHalfReady(gameId) && !room.timer) {
      if (room.phase === 'results') {
        this.startResultsPhaseTimer(gameId, this.TIMER_DURATION, async () => {
          const game = await this.gameApplicationService.findById(gameId);
          const currentRound = game?.currentRound || 1;
          const maxRounds = game?.maxRounds || 10;
          const isNextRoundLast = currentRound >= maxRounds;

          if (isNextRoundLast) {
            await this.switchToFinishPhase(gameId);
          } else {
            await this.startNewRound(gameId);
          }
        });

        const updatedState = await this.getRoomState(gameId);
        return {
          shouldSwitch: false,
          newState: updatedState || undefined,
        };
      }
    }

    return { shouldSwitch: false };
  }
}
