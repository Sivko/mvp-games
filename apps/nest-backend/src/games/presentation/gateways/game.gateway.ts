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
import { GameApplicationService } from '../../application/services/game.application.service';
import { GameSessionService } from '../../application/services/game-session.service';

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameApplicationService: GameApplicationService,
    private readonly gameSessionService: GameSessionService,
  ) {}

  handleConnection(_client: Socket) {
    // Connection handled
  }

  async handleDisconnect(_client: Socket) {
    // Disconnect handled by GameSessionService
  }

  @SubscribeMessage('join-game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string },
  ) {
    const { gameId, userId } = data;

    client.join(gameId);

    const { isNewUser } = await this.gameSessionService.addUserToRoom(
      gameId,
      userId,
      client.id,
    );

    if (isNewUser) {
      const actionMessage = await this.gameSessionService.getActionMessage(
        userId,
        'присоединился к игре',
      );
      if (actionMessage) {
        this.server.to(gameId).emit('new-action', { message: actionMessage });
      }
    }

    this.server.to(gameId).emit('online-users-update', {
      count: this.gameSessionService.getOnlineUsersCount(gameId),
    });

    const onlinePlayers =
      await this.gameSessionService.getOnlinePlayers(gameId);
    this.server.to(gameId).emit('online-players-update', {
      players: onlinePlayers,
    });

    const roomState = await this.gameSessionService.getRoomState(gameId);
    if (!roomState) {
      return;
    }

    client.emit('game-state', roomState);

    if (roomState.phase === 'results' && roomState.answers) {
      const reactions = await this.gameSessionService.getReactionsForAnswers(
        roomState.answers.map((a) => a.id),
      );
      reactions.forEach((r) => {
        client.emit('reactions-updated', {
          answerId: r.answerId,
          reactions: r.reactions,
        });
      });
    }
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string; text: string },
  ) {
    const { gameId, userId, text } = data;

    try {
      const result = await this.gameSessionService.submitAnswer(
        gameId,
        userId,
        text,
      );

      client.emit('answer-submitted', { success: true });

      if (result.actionMessage) {
        this.server.to(gameId).emit('new-action', {
          message: result.actionMessage,
        });
      }

      if (result.shouldUpdateScores && result.userScores) {
        this.server.to(gameId).emit('user-scores-update', {
          userScores: result.userScores,
        });
      }

      if (result.shouldEmitReadyUpdate && result.readyUpdate) {
        this.server.to(gameId).emit('ready-update', result.readyUpdate);
      }

      if (result.shouldSwitchToResults) {
        const transition =
          await this.gameSessionService.handleAnswerSubmissionTransition(
            gameId,
          );
        if (transition.shouldSwitch && transition.newState) {
          this.server.to(gameId).emit('game-state', transition.newState);
          if (transition.reactions) {
            transition.reactions.forEach((r) => {
              this.server.to(gameId).emit('reactions-updated', {
                answerId: r.answerId,
                reactions: r.reactions,
              });
            });
          }
        } else if (transition.newState?.timerEndsAt) {
          this.server.to(gameId).emit('timer-update', {
            endsAt: transition.newState.timerEndsAt,
          });
        }
      } else {
        const transition =
          await this.gameSessionService.handleAnswerSubmissionTransition(
            gameId,
          );
        if (transition.newState?.timerEndsAt) {
          this.server.to(gameId).emit('timer-update', {
            endsAt: transition.newState.timerEndsAt,
          });
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
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
    const { gameId, userId, answerId, reactionId } = data;

    try {
      const result = await this.gameSessionService.submitReaction(
        gameId,
        userId,
        answerId,
        reactionId,
      );

      this.server.to(gameId).emit('reactions-updated', {
        answerId,
        reactions: result.reactions,
      });

      if (result.actionMessage) {
        this.server.to(gameId).emit('new-action', {
          message: result.actionMessage,
        });
      }
    } catch (error) {
      console.error('Error submitting reaction:', error);
    }
  }

  @SubscribeMessage('ready-for-next-round')
  async handleReadyForNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; userId: string },
  ) {
    const { gameId, userId } = data;

    try {
      this.gameSessionService.markUserReady(gameId, userId);

      const roomState = await this.gameSessionService.getRoomState(gameId);
      if (roomState) {
        this.server.to(gameId).emit('ready-update', {
          readyCount: roomState.readyCount,
          totalUsers: roomState.onlineUsersCount,
          readyUsers: roomState.readyUsers,
        });
      }

      const transition =
        await this.gameSessionService.handleReadyForNextRoundTransition(gameId);

      if (transition.shouldSwitch) {
        if (transition.shouldCheckNextRound) {
          const game = await this.gameApplicationService.findById(gameId);
          const currentRound = game?.currentRound || 1;
          const maxRounds = game?.maxRounds || 10;
          const isNextRoundLast = currentRound >= maxRounds;

          if (isNextRoundLast) {
            await this.gameSessionService.switchToFinishPhase(gameId);
            const finishState =
              await this.gameSessionService.getRoomState(gameId);
            if (finishState) {
              this.server.to(gameId).emit('game-state', finishState);
            }
          } else {
            await this.gameSessionService.startNewRound(gameId);
            const newRoundState =
              await this.gameSessionService.getRoomState(gameId);
            if (newRoundState) {
              this.server.to(gameId).emit('game-state', newRoundState);
            }
          }
        } else if (transition.newState) {
          this.server.to(gameId).emit('game-state', transition.newState);
        }
      } else if (transition.newState?.timerEndsAt) {
        this.server.to(gameId).emit('timer-update', {
          endsAt: transition.newState.timerEndsAt,
        });
      }
    } catch (error) {
      console.error('Error handling ready for next round:', error);
    }
  }
}
