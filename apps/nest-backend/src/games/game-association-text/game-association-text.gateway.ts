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

interface GameRoom {
  gameId: string;
  users: Map<string, { userId: string; socketId: string }>;
  phase: 'input' | 'results'; // Фрейм 1 или Фрейм 2
  timer: NodeJS.Timeout | null;
  timerEndsAt: number | null;
  readyUsers: Set<string>; // Set of userIds who are ready
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
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Удаляем пользователя из всех комнат
    this.gameRooms.forEach((room, gameId) => {
      if (room.users.has(client.id)) {
        room.users.delete(client.id);
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
      this.gameRooms.set(gameId, {
        gameId,
        users: new Map(),
        phase: 'input',
        timer: null,
        timerEndsAt: null,
        readyUsers: new Set(),
      });
    }

    const room = this.gameRooms.get(gameId)!;

    // Добавляем пользователя в комнату
    room.users.set(client.id, { userId, socketId: client.id });

    // Отправляем событие о присоединении пользователя
    await this.sendNewAction(gameId, userId, 'присоединился к игре');

    // Если комната в фазе results, загружаем ответы и реакции
    if (room.phase === 'results') {
      const answers = await this.answersService.findByGameId(gameId);
      
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
          };
        })
      );
      
      // Отправляем текущую фазу с ответами
      client.emit('game-state', {
        phase: room.phase,
        onlineUsersCount: room.users.size,
        timerEndsAt: room.timerEndsAt,
        readyCount: room.readyUsers.size,
        answers: answersWithUserNames,
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
      // Отправляем текущую фазу и количество онлайн пользователей
      this.server.to(gameId).emit('game-state', {
        phase: room.phase,
        onlineUsersCount: room.users.size,
        timerEndsAt: room.timerEndsAt,
        readyCount: room.readyUsers.size,
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

    if (existingAnswer) {
      // Обновляем существующий ответ
      existingAnswer.text = text;
      if (bankAssociationTextId) {
        existingAnswer.bankAssociationTextId = bankAssociationTextId as any;
      }
      await existingAnswer.save();
    } else {
      // Создаем новый ответ
      await this.answersService.create({
        gameId,
        userId,
        text,
        bankAssociationTextId,
      });
    }

    // Отправляем подтверждение
    client.emit('answer-submitted', { success: true });

    // Отправляем событие о новом действии
    await this.sendNewAction(gameId, userId, 'добавил слово');

    // Добавляем пользователя в готовые
    room.readyUsers.add(userId);

    // Проверяем, готово ли больше половины пользователей
    const totalUsers = room.users.size;
    const readyCount = room.readyUsers.size;
    const halfUsers = Math.ceil(totalUsers / 2);

    // Отправляем обновление готовности
    this.server.to(gameId).emit('ready-update', {
      readyCount,
      totalUsers,
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
      // Создаем реакцию
      await this.reactionsService.create({
        answerId,
        userId,
        reactionId,
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

    if (!room || room.phase !== 'results') {
      return;
    }

    // Добавляем пользователя в готовые
    room.readyUsers.add(userId);

    // Проверяем, готово ли больше половины пользователей
    const totalUsers = room.users.size;
    const readyCount = room.readyUsers.size;
    const halfUsers = Math.ceil(totalUsers / 2);

    // Отправляем обновление готовности
    this.server.to(gameId).emit('ready-update', {
      readyCount,
      totalUsers,
    });

    // Если все пользователи нажали "Готово", сразу переходим к новому раунду
    if (readyCount >= totalUsers && room.phase === 'results') {
      // Очищаем таймер, если он был запущен
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      // Сразу переходим к новому раунду
      await this.startNewRound(gameId);
      return;
    }

    // Если больше половины готовы и таймер не запущен, запускаем его
    if (readyCount > halfUsers && !room.timer) {
      this.startResultsPhaseTimer(gameId);
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
        };
      })
    );

    // Отправляем результаты всем в комнате
    this.server.to(gameId).emit('game-state', {
      phase: 'results',
      onlineUsersCount: room.users.size,
      answers: answersWithUserNames,
      readyCount: 0,
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
      await this.startNewRound(gameId);
    }, duration);

    // Отправляем обновление таймера всем в комнате
    this.server.to(gameId).emit('timer-update', {
      endsAt: room.timerEndsAt,
    });
  }

  private async startNewRound(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Очищаем таймер фазы results
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Обновляем вопрос в игре
    await this.gamesService.updateQuestion(gameId);

    // Удаляем все ответы для этой игры
    await this.answersService.deleteByGameId(gameId);

    // Переключаемся обратно на фазу input
    room.phase = 'input';
    // Сбрасываем готовность пользователей для новой фазы
    room.readyUsers.clear();

    // Получаем обновленную игру
    const game = await this.gamesService.findById(gameId);

    // Отправляем новое состояние игры
    this.server.to(gameId).emit('game-state', {
      phase: 'input',
      onlineUsersCount: room.users.size,
      question: game?.question || '',
      timerEndsAt: null,
      readyCount: 0,
    });
  }

  private broadcastOnlineUsers(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (room) {
      this.server.to(gameId).emit('online-users-update', {
        count: room.users.size,
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


