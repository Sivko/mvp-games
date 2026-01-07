import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AnswersService } from '../../answers/answers.service';
import { ReactionsService } from '../../reactions/reactions.service';
import { GamesService } from '../games.service';
import { UsersService } from '../../users/users.service';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';

interface GameRoom {
  gameId: string;
  users: Map<string, { userId: string; socketId: string }>; // Map<socketId, { userId, socketId }>
  uniqueUserIds: Set<string>; // Set уникальных userId для правильного подсчета пользователей
  phase: 'input' | 'results' | 'finish'; // Фрейм 1, Фрейм 2 или Фрейм 3 (финал раунда)
  timer: NodeJS.Timeout | null;
  timerEndsAt: number | null;
  readyUsers: Set<string>; // Set of userIds who are ready
  userScores: Map<string, number>; // Map<userId, totalScore> - общие очки пользователей
}

@WebSocketGateway({
  namespace: '/association-text',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class GameAssociationTextGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private gameRooms = new Map<string, GameRoom>();

  constructor(
    private answersService: AnswersService,
    private reactionsService: ReactionsService,
    private gamesService: GamesService,
    private usersService: UsersService,
    private elasticsearchService: ElasticsearchService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Удаляем пользователя из всех комнат
    this.gameRooms.forEach((room, gameId) => {
      const userInfo = room.users.get(client.id);
      if (userInfo) {
        room.users.delete(client.id);
        // Проверяем, остались ли еще соединения для этого userId
        const hasOtherConnections = Array.from(room.users.values()).some(
          (u) => u.userId === userInfo.userId
        );
        // Если больше нет соединений для этого userId, удаляем его из уникальных пользователей
        if (!hasOtherConnections) {
          room.uniqueUserIds.delete(userInfo.userId);
        }
        this.broadcastOnlineUsers(gameId);
      }
    });
  }

  @SubscribeMessage('join-game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string },
  ) {
    const { gameId, userId } = data;

    // Присоединяемся к комнате игры
    client.join(gameId);

    // Инициализируем комнату, если её нет
    if (!this.gameRooms.has(gameId)) {
      // Загружаем игру для получения сохраненных очков
      const game = await this.gamesService.findById(gameId);
      const userScores = new Map<string, number>();
      
      // Загружаем очки из game.stats, если они есть
      if (game?.stats) {
        game.stats.forEach((score, userId) => {
          userScores.set(userId, score);
        });
      }
      
      this.gameRooms.set(gameId, {
        gameId,
        users: new Map(),
        uniqueUserIds: new Set(),
        phase: 'input',
        timer: null,
        timerEndsAt: null,
        readyUsers: new Set(),
        userScores,
      });
    }

    const room = this.gameRooms.get(gameId)!;

    // Добавляем пользователя в комнату
    const isNewUser = !room.uniqueUserIds.has(userId);
    room.users.set(client.id, { userId, socketId: client.id });
    room.uniqueUserIds.add(userId);

    // Добавляем пользователя в массив users игры в базе данных
    await this.gamesService.addUserToGame(gameId, userId);

    // Отправляем событие о присоединении пользователя только если это новый пользователь
    if (isNewUser) {
      await this.sendNewAction(gameId, userId, 'присоединился к игре');
    }

    // Если комната в фазе finish, отправляем состояние finish
    if (room.phase === 'finish') {
      // Преобразуем Map очков в объект для отправки клиентам
      const userScoresObject: Record<string, number> = {};
      room.userScores.forEach((score, userId) => {
        userScoresObject[userId] = score;
      });

      // Загружаем имена всех игроков из userScores
      const playersWithNames = await Promise.all(
        Array.from(room.userScores.keys()).map(async (userId) => {
          const user = await this.usersService.findById(userId);
          const userName = user?.name || user?.telegramFirstName || user?.telegramUsername || 'Неизвестный';
          return {
            userId,
            userName,
            initial: userName.charAt(0).toUpperCase(),
          };
        })
      );

      // Получаем информацию о раундах из игры
      const game = await this.gamesService.findById(gameId);

      const currentRound = game?.currentRound || 1;
      const maxRounds = game?.maxRounds || 4;
      const isGameFinished = currentRound >= maxRounds;

      // Отправляем текущую фазу finish
      client.emit('game-state', {
        phase: room.phase,
        onlineUsersCount: room.uniqueUserIds.size,
        readyCount: room.readyUsers.size,
        readyUsers: Array.from(room.readyUsers),
        userScores: userScoresObject,
        players: playersWithNames,
        currentRound,
        maxRounds,
        isGameFinished,
      });
    }
    // Если комната в фазе results, загружаем ответы и реакции
    else if (room.phase === 'results') {
      const answers = await this.answersService.findByGameId(gameId);
      
      // Пересчитываем очки всех пользователей из их ответов текущего раунда
      // Это гарантирует правильность очков при присоединении к игре
      const userScoresMap = new Map<string, number>();
      answers.forEach((a) => {
        const userId = a.user?.toString();
        if (userId) {
          const currentScore = userScoresMap.get(userId) || 0;
          userScoresMap.set(userId, currentScore + (a.score || 0));
        }
      });
      
      // Получаем игру для получения очков из предыдущих раундов
      const gameForStats = await this.gamesService.findById(gameId);
      
      // Обновляем очки в комнате, суммируя очки из предыдущих раундов и текущего раунда
      userScoresMap.forEach((currentRoundScore, userId) => {
        const previousRoundsScore = gameForStats?.stats?.get(userId) || 0;
        const totalScore = previousRoundsScore + currentRoundScore;
        room.userScores.set(userId, totalScore);
      });
      
      // Также добавляем пользователей, которые есть в game.stats, но нет в текущих ответах
      if (gameForStats?.stats) {
        gameForStats.stats.forEach((previousScore, userId) => {
          if (!userScoresMap.has(userId)) {
            // Если пользователь есть в предыдущих раундах, но нет в текущем раунде
            room.userScores.set(userId, previousScore);
          }
        });
      }
      
      // Загружаем имена пользователей для ответов
      const answersWithUserNames = await Promise.all(
        answers.map(async (a) => {
          const user = await this.usersService.findById(a.user.toString());
          const userName = user?.name || user?.telegramFirstName || user?.telegramUsername || 'Неизвестный';
          return {
            id: a._id.toString(),
            userId: a.user.toString(),
            text: a.text,
            userName,
            score: a.score || 0,
          };
        })
      );
      
      // Преобразуем Map очков в объект для отправки клиентам
      const userScoresObject: Record<string, number> = {};
      room.userScores.forEach((score, userId) => {
        userScoresObject[userId] = score;
      });

      // Получаем информацию о раундах из игры (используем gameForStats, если он уже загружен, иначе загружаем заново)
      const gameForRounds = gameForStats || await this.gamesService.findById(gameId);
      
      // Отправляем текущую фазу с ответами
      client.emit('game-state', {
        phase: room.phase,
        onlineUsersCount: room.uniqueUserIds.size,
        timerEndsAt: room.timerEndsAt,
        readyCount: room.readyUsers.size,
        readyUsers: Array.from(room.readyUsers),
        answers: answersWithUserNames,
        userScores: userScoresObject,
        currentRound: gameForRounds?.currentRound || 1,
        maxRounds: gameForRounds?.maxRounds || 10,
      });

      // Загружаем и отправляем все существующие реакции для каждого ответа
      for (const answer of answers) {
        const answerId = answer._id.toString();
        const reactions = await this.reactionsService.findByAnswerId(answerId);
        client.emit('reactions-updated', {
          answerId,
          reactions: reactions.map((r) => ({
            id: r._id.toString(),
            userId: r.userId.toString(),
            reactionId: r.reactionId.toString(),
          })),
        });
      }
    } else {
      // Преобразуем Map очков в объект для отправки клиентам
      const userScoresObject: Record<string, number> = {};
      room.userScores.forEach((score, userId) => {
        userScoresObject[userId] = score;
      });

      // Получаем информацию о раундах из игры
      const game = await this.gamesService.findById(gameId);

      // Отправляем текущую фазу и количество онлайн пользователей
      this.server.to(gameId).emit('game-state', {
        phase: room.phase,
        onlineUsersCount: room.uniqueUserIds.size,
        timerEndsAt: room.timerEndsAt,
        readyCount: room.readyUsers.size,
        readyUsers: Array.from(room.readyUsers),
        userScores: userScoresObject,
        currentRound: game?.currentRound || 1,
        maxRounds: game?.maxRounds || 10,
      });
    }
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string; text: string },
  ) {
    const { gameId, userId, text } = data;
    const room = this.gameRooms.get(gameId);

    if (!room || room.phase !== 'input') {
      return;
    }

    // Получаем игру для получения bankAssociationTextId
    const game = await this.gamesService.findById(gameId);
    const bankAssociationTextId = game?.usedQuestions && game.usedQuestions.length > 0
      ? game.usedQuestions[game.usedQuestions.length - 1]
      : undefined;

    // Проверяем, не отправил ли пользователь уже ответ
    const existingAnswer = await this.answersService.findByGameIdAndUserId(
      gameId,
      userId,
    );

    let answerId: string;
    if (existingAnswer) {
      // Обновляем существующий ответ
      existingAnswer.text = text;
      if (bankAssociationTextId) {
        existingAnswer.bankAssociationTextId = bankAssociationTextId as any;
      }
      await existingAnswer.save();
      answerId = existingAnswer._id.toString();
    } else {
      // Создаем новый ответ
      const newAnswer = await this.answersService.create({
        gameId,
        userId,
        text,
        bankAssociationTextId,
      });
      answerId = newAnswer._id.toString();
    }

    // Вычисляем и сохраняем score, если есть bankAssociationTextId
    if (bankAssociationTextId) {
      try {
        const scoreResult = await this.elasticsearchService.calculateScore(
          bankAssociationTextId.toString(),
          text,
          answerId,
        );
        
        // Пересчитываем очки пользователя из всех его ответов в текущем раунде
        // Это гарантирует правильность очков даже при множественных обновлениях
        const userAnswers = await this.answersService.findByGameId(gameId);
        const currentRoundScore = userAnswers
          .filter((a) => a.user?.toString() === userId)
          .reduce((sum, a) => sum + (a.score || 0), 0);
        
        // Получаем очки из предыдущих раундов из game.stats
        const game = await this.gamesService.findById(gameId);
        const previousRoundsScore = game?.stats?.get(userId) || 0;
        
        // Суммируем очки из предыдущих раундов и текущего раунда
        const userTotalScore = previousRoundsScore + currentRoundScore;
        
        // Обновляем очки пользователя в комнате
        room.userScores.set(userId, userTotalScore);

        // Отправляем обновленные очки всем клиентам
        const userScoresObject: Record<string, number> = {};
        room.userScores.forEach((score, uid) => {
          userScoresObject[uid] = score;
        });

        this.server.to(gameId).emit('user-scores-update', {
          userScores: userScoresObject,
        });
      } catch (error) {
        console.error('Failed to calculate score:', error);
        // Продолжаем выполнение даже если не удалось вычислить score
      }
    }

    // Отправляем подтверждение
    client.emit('answer-submitted', { success: true });

    // Отправляем событие о новом действии
    await this.sendNewAction(gameId, userId, 'добавил слово');

    // Добавляем пользователя в готовые
    room.readyUsers.add(userId);

    // Проверяем, готово ли больше половины пользователей
    const totalUsers = room.uniqueUserIds.size;
    const readyCount = room.readyUsers.size;
    const halfUsers = Math.ceil(totalUsers / 2);

    // Отправляем обновление готовности с списком готовых пользователей
    this.server.to(gameId).emit('ready-update', {
      readyCount,
      totalUsers,
      readyUsers: Array.from(room.readyUsers),
    });

    // Если все пользователи отправили ответы, сразу переходим к фазе results
    if (readyCount >= totalUsers && room.phase === 'input') {
      // Очищаем таймер, если он был запущен
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      // Сразу переходим к фазе results
      await this.switchToResultsPhase(gameId);
      return;
    }

    // Если больше половины готовы и таймер не запущен, запускаем его
    if (readyCount > halfUsers && !room.timer && room.phase === 'input') {
      this.startInputPhaseTimer(gameId);
    }
  }

  @SubscribeMessage('submit-reaction')
  async handleSubmitReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      gameId: string;
      userId: string;
      answerId: string;
      reactionId: string;
    },
  ) {
    const { userId, answerId, reactionId } = data;
    const room = this.gameRooms.get(data.gameId);

    if (!room || room.phase !== 'results') {
      return;
    }

    // Проверяем, не отправил ли пользователь уже эту реакцию
    const existingReactions =
      await this.reactionsService.findByAnswerAndUser(answerId, userId);

    const hasReaction = existingReactions.some(
      (r) => r.reactionId.toString() === reactionId,
    );

    if (!hasReaction) {
      // Создаем реакцию с gameId
      await this.reactionsService.create({
        answerId,
        userId,
        reactionId,
        gameId: data.gameId,
      });
      // Отправляем событие о новой реакции
      await this.sendNewAction(data.gameId, userId, 'поставил реакцию');
    } else {
      // Удаляем реакцию (toggle)
      await this.reactionsService.deleteByAnswerAndUserAndReaction(
        answerId,
        userId,
        reactionId,
      );
      // Отправляем событие об удалении реакции
      await this.sendNewAction(data.gameId, userId, 'убрал реакцию');
    }

    // Отправляем обновленные реакции для этого ответа
    const reactions = await this.reactionsService.findByAnswerId(answerId);
    this.server.to(data.gameId).emit('reactions-updated', {
      answerId,
      reactions: reactions.map((r) => ({
        id: r._id.toString(),
        userId: r.userId.toString(),
        reactionId: r.reactionId.toString(),
      })),
    });
  }

  @SubscribeMessage('ready-for-next-round')
  async handleReadyForNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string },
  ) {
    const { gameId, userId } = data;
    const room = this.gameRooms.get(gameId);

    console.log('[handleReadyForNextRound] Получен запрос:', { gameId, userId, roomPhase: room?.phase });

    if (!room || (room.phase !== 'results' && room.phase !== 'finish')) {
      console.log('[handleReadyForNextRound] Выход: комната не найдена или неправильная фаза', {
        roomExists: !!room,
        roomPhase: room?.phase,
      });
      return;
    }

    // Добавляем пользователя в готовые
    room.readyUsers.add(userId);

    // Проверяем, готово ли больше половины пользователей
    const totalUsers = room.uniqueUserIds.size;
    const readyCount = room.readyUsers.size;
    const halfUsers = Math.ceil(totalUsers / 2);

    console.log('[handleReadyForNextRound] Статистика готовности:', {
      phase: room.phase,
      totalUsers,
      readyCount,
      halfUsers,
      readyUsers: Array.from(room.readyUsers),
    });

    // Отправляем обновление готовности с списком готовых пользователей
    this.server.to(gameId).emit('ready-update', {
      readyCount,
      totalUsers,
      readyUsers: Array.from(room.readyUsers),
    });

    // Если фаза results - проверяем, нужно ли показывать итоги раунда
    if (readyCount >= totalUsers && room.phase === 'results') {
      console.log('[handleReadyForNextRound] Все готовы в results');
      // Очищаем таймер, если он был запущен
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      
      // Проверяем, будет ли следующий раунд последним
      const game = await this.gamesService.findById(gameId);
      const currentRound = game?.currentRound || 1;
      const maxRounds = game?.maxRounds || 10;
      const isNextRoundLast = currentRound >= maxRounds;
      
      console.log('[handleReadyForNextRound] Проверка итогов:', {
        currentRound,
        maxRounds,
        isNextRoundLast,
      });
      
      // Если следующий раунд будет последним - показываем итоги игры
      if (isNextRoundLast) {
        console.log('[handleReadyForNextRound] Следующий раунд последний, переходим к finish');
        await this.switchToFinishPhase(gameId);
      } else {
        // Иначе сразу переходим к новому раунду
        console.log('[handleReadyForNextRound] Следующий раунд не последний, сразу переходим к новому раунду');
        await this.startNewRound(gameId);
      }
      return;
    }

    // Если фаза finish - переходим к новому раунду (сбрасываем раунд к 1, если достигнут максимум)
    if (readyCount >= totalUsers && room.phase === 'finish') {
      console.log('[handleReadyForNextRound] Все готовы в finish, переходим к новому раунду');
      // Очищаем таймер, если он был запущен
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      
      // Всегда переходим к новому раунду (startNewRound сам сбросит раунд к 1, если достигнут максимум)
      await this.startNewRound(gameId);
      return;
    }

    console.log('[handleReadyForNextRound] Не все готовы, продолжаем ждать');

    // Если больше половины готовы и таймер не запущен, запускаем его
    if (readyCount > halfUsers && !room.timer) {
      if (room.phase === 'results') {
        this.startResultsPhaseTimer(gameId);
      } else if (room.phase === 'finish') {
        // В фазе finish таймер не нужен, просто ждем готовности всех
      }
    }
  }

  private startInputPhaseTimer(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    const duration = 10000; // 10 секунд
    room.timerEndsAt = Date.now() + duration;

    room.timer = setTimeout(async () => {
      await this.switchToResultsPhase(gameId);
    }, duration);

    // Отправляем обновление таймера всем в комнате
    this.server.to(gameId).emit('timer-update', {
      endsAt: room.timerEndsAt,
    });
  }

  private async switchToResultsPhase(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Очищаем таймер фазы input
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Переключаемся на фазу results
    room.phase = 'results';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();

    // Получаем все ответы для этой игры
    const answers = await this.answersService.findByGameId(gameId);

    // Очки уже суммируются при отправке ответов, поэтому здесь просто отправляем текущие очки

    // Загружаем имена пользователей для ответов
    const answersWithUserNames = await Promise.all(
      answers.map(async (a) => {
        const userId = a.user?.toString() || null;
        const user = userId ? await this.usersService.findById(userId) : null;
        const userName = user?.name || user?.telegramFirstName || user?.telegramUsername || 'Неизвестный';
        return {
          id: a._id.toString(),
          userId: userId || '',
          text: a.text,
          userName,
          score: a.score || 0,
        };
      })
    );

    // Преобразуем Map очков в объект для отправки клиентам
    const userScoresObject: Record<string, number> = {};
    room.userScores.forEach((score, userId) => {
      userScoresObject[userId] = score;
    });

    // Получаем информацию о раундах из игры
    const game = await this.gamesService.findById(gameId);

    // Отправляем результаты всем в комнате
    this.server.to(gameId).emit('game-state', {
      phase: 'results',
      onlineUsersCount: room.uniqueUserIds.size,
      answers: answersWithUserNames,
      readyCount: 0,
      readyUsers: Array.from(room.readyUsers),
      userScores: userScoresObject,
      currentRound: game?.currentRound || 1,
      maxRounds: game?.maxRounds || 10,
    });

    // Загружаем и отправляем все существующие реакции для каждого ответа
    for (const answer of answers) {
      const answerId = answer._id.toString();
      const reactions = await this.reactionsService.findByAnswerId(answerId);
      this.server.to(gameId).emit('reactions-updated', {
        answerId,
        reactions: reactions.map((r) => ({
          id: r._id.toString(),
          userId: r.userId.toString(),
          reactionId: r.reactionId.toString(),
        })),
      });
    }
  }

  private startResultsPhaseTimer(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    const duration = 10000; // 10 секунд
    room.timerEndsAt = Date.now() + duration;

    room.timer = setTimeout(async () => {
      // Проверяем, будет ли следующий раунд последним
      const game = await this.gamesService.findById(gameId);
      const currentRound = game?.currentRound || 1;
      const maxRounds = game?.maxRounds || 10;
      const isNextRoundLast = currentRound >= maxRounds;
      
      console.log('[startResultsPhaseTimer] Таймер истек, проверка итогов:', {
        currentRound,
        maxRounds,
        isNextRoundLast,
      });
      
      // Если следующий раунд будет последним - показываем итоги игры
      if (isNextRoundLast) {
        console.log('[startResultsPhaseTimer] Следующий раунд последний, переходим к finish');
        await this.switchToFinishPhase(gameId);
      } else {
        // Иначе сразу переходим к новому раунду
        console.log('[startResultsPhaseTimer] Следующий раунд не последний, сразу переходим к новому раунду');
        await this.startNewRound(gameId);
      }
    }, duration);

    // Отправляем обновление таймера всем в комнате
    this.server.to(gameId).emit('timer-update', {
      endsAt: room.timerEndsAt,
    });
  }

  private async switchToFinishPhase(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Очищаем таймер фазы results
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Переключаемся на фазу finish
    room.phase = 'finish';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();

    // Преобразуем Map очков в объект для отправки клиентам
    const userScoresObject: Record<string, number> = {};
    room.userScores.forEach((score, userId) => {
      userScoresObject[userId] = score;
    });

    // Загружаем имена всех игроков из userScores
    const playersWithNames = await Promise.all(
      Array.from(room.userScores.keys()).map(async (userId) => {
        const user = await this.usersService.findById(userId);
        const userName = user?.name || user?.telegramFirstName || user?.telegramUsername || 'Неизвестный';
        return {
          userId,
          userName,
          initial: userName.charAt(0).toUpperCase(),
        };
      })
    );

    // Получаем информацию о раундах из игры
    const game = await this.gamesService.findById(gameId);
    const currentRound = game?.currentRound || 1;
    const maxRounds = game?.maxRounds || 10;
    
    // Проверяем, был ли это последний раунд
    const isGameFinished = currentRound >= maxRounds;

    console.log('[switchToFinishPhase] Переход к finish', {
      currentRound,
      maxRounds,
      isGameFinished,
    });

    // Отправляем состояние finish всем в комнате
    this.server.to(gameId).emit('game-state', {
      phase: 'finish',
      onlineUsersCount: room.uniqueUserIds.size,
      readyCount: 0,
      readyUsers: Array.from(room.readyUsers),
      userScores: userScoresObject,
      players: playersWithNames,
      currentRound,
      maxRounds,
      isGameFinished,
    });
  }

  private async startNewRound(gameId: string) {
    console.log('[startNewRound] Начало нового раунда для игры:', gameId);
    const room = this.gameRooms.get(gameId);
    if (!room) {
      console.error('[startNewRound] Комната не найдена для игры:', gameId);
      return;
    }

    console.log('[startNewRound] Текущее состояние комнаты:', {
      phase: room.phase,
      usersCount: room.uniqueUserIds.size,
      userScoresSize: room.userScores.size,
    });

    // Очищаем таймер фазы results
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
      console.log('[startNewRound] Таймер очищен');
    }

    // Получаем игру для проверки раундов
    const game = await this.gamesService.findById(gameId);
    if (!game) {
      console.error('[startNewRound] Игра не найдена:', gameId);
      return;
    }

    // Проверяем, достигнут ли максимальный раунд
    const currentRound = game.currentRound || 1;
    const maxRounds = game.maxRounds || 10;

    console.log('[startNewRound] Информация о раундах:', { currentRound, maxRounds });

    // Вычисляем очки текущего раунда из ответов перед их удалением
    const answers = await this.answersService.findByGameId(gameId);
    const currentRoundScores: Record<string, number> = {};
    
    answers.forEach((a) => {
      const userId = a.user?.toString();
      if (userId) {
        const currentScore = currentRoundScores[userId] || 0;
        currentRoundScores[userId] = currentScore + (a.score || 0);
      }
    });
    
    // Сохраняем очки текущего раунда в game.stats перед удалением ответов
    if (Object.keys(currentRoundScores).length > 0) {
      await this.gamesService.updateStats(gameId, currentRoundScores);
      console.log('[startNewRound] Очки текущего раунда сохранены в game.stats');
    }

    // Загружаем очки из game.stats обратно в room.userScores для нового раунда
    room.userScores.clear();
    if (game?.stats) {
      game.stats.forEach((score, userId) => {
        room.userScores.set(userId, score);
      });
    }
    console.log('[startNewRound] Очки пользователей загружены из game.stats для нового раунда');

    // Если текущий раунд уже равен или больше максимального, сбрасываем счетчик раундов к 1
    if (currentRound >= maxRounds) {
      console.log('[startNewRound] Текущий раунд достиг или превысил максимум, сбрасываем счетчик к 1');
      // Сбрасываем раунд к 1 и сохраняем статус active
      game.currentRound = 1;
      game.status = 'active'; // Явно сохраняем статус active
      // Очищаем статистику очков для нового цикла раундов
      game.stats = new Map<string, number>();
      await game.save();
      // Очищаем очки в комнате для нового цикла раундов
      room.userScores.clear();
      console.log('[startNewRound] Счетчик раундов сброшен к 1, статистика очков очищена, статус остался active');
    } else {
      // Увеличиваем раунд в базе данных
      await this.gamesService.incrementRound(gameId);
      console.log('[startNewRound] Раунд увеличен в БД');
    }

    // Обновляем вопрос в игре
    await this.gamesService.updateQuestion(gameId);
    console.log('[startNewRound] Вопрос обновлен в БД');

    // Удаляем все ответы для этой игры
    await this.answersService.deleteByGameId(gameId);
    console.log('[startNewRound] Ответы удалены из БД');

    // Переключаемся обратно на фазу input
    room.phase = 'input';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();
    console.log('[startNewRound] Фаза переключена на input, готовность сброшена');

    // Загружаем финальную версию игры после всех обновлений
    const finalGame = await this.gamesService.findById(gameId);
    
    console.log('[startNewRound] Финальная версия игры:', {
      currentRound: finalGame?.currentRound,
      maxRounds: finalGame?.maxRounds,
      status: finalGame?.status,
    });

    // Преобразуем Map очков в объект
    const userScoresObject: Record<string, number> = {};
    room.userScores.forEach((score, userId) => {
      userScoresObject[userId] = score;
    });

    const gameStateData = {
      phase: 'input',
      onlineUsersCount: room.uniqueUserIds.size,
      question: finalGame?.question || '',
      timerEndsAt: null,
      readyCount: 0,
      readyUsers: Array.from(room.readyUsers),
      userScores: userScoresObject,
      currentRound: finalGame?.currentRound || 1,
      maxRounds: finalGame?.maxRounds || 10,
    };

    console.log('[startNewRound] Отправка game-state:', gameStateData);

    // Отправляем новое состояние игры
    this.server.to(gameId).emit('game-state', gameStateData);
    console.log('[startNewRound] game-state отправлен клиентам');
  }


  private broadcastOnlineUsers(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (room) {
      this.server.to(gameId).emit('online-users-update', {
        count: room.uniqueUserIds.size,
      });
    }
  }

  /**
   * Отправляет событие о новом действии пользователя
   * @param gameId - ID игры
   * @param userId - ID пользователя
   * @param action - описание действия (например, "добавил слово")
   */
  private async sendNewAction(
    gameId: string,
    userId: string,
    action: string,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (user) {
        const userName = user.name || user.telegramFirstName || 'Неизвестный';
        const message = `<strong>${userName}</strong> ${action}`;
        this.server.to(gameId).emit('new-action', { message });
      }
    } catch (error) {
      console.error('Error sending new action:', error);
    }
  }
}


