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
import { RoomService } from './room/room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    console.log(`Client ${client.id} joining room: ${roomId}`);
    
    // Присоединяем клиента к комнате Socket.IO
    client.join(`room:${roomId}`);
    
    // Отправляем подтверждение клиенту
    client.emit('room-joined', { roomId });
  }

  @SubscribeMessage('add-word')
  async handleAddWord(
    @MessageBody() data: { roomId: string; word: string; user: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, word, user } = data;
    console.log(`Adding word "${word}" to room ${roomId} by ${client.id}`);

    try {
      // Получаем комнату
      const room = await this.roomService.findById(roomId);
      if (!room) {
        client.emit('error', { message: 'Room not found' });
        return;
      }

      // Здесь должна быть логика вычисления similarity через Python API
      // Пока используем заглушку
      const similarity = 0.5; // TODO: Вычислить через Python API

      // Добавляем слово в комнату
      const updatedRoom = await this.roomService.addWordToRoom(
        roomId,
        word,
        similarity,
        user,
      );

      if (!updatedRoom) {
        client.emit('error', { message: 'Failed to add word' });
        return;
      }

      // Отправляем обновление всем клиентам в комнате
      this.server.to(`room:${roomId}`).emit('word-added', {
        word,
        similarity,
        user,
      });

      // Отправляем полное обновление комнаты
      this.server.to(`room:${roomId}`).emit('room-updated', {
        room: updatedRoom.toObject(),
      });
    } catch (error) {
      console.error('Error adding word:', error);
      client.emit('error', { message: 'Error adding word' });
    }
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Message from ${client.id}: ${data.message}`);
    
    // Отправляем ответ обратно клиенту
    client.emit('message', {
      type: 'response',
      message: `Server received: ${data.message}`,
      timestamp: new Date().toISOString(),
    });

    // Отправляем сообщение всем подключенным клиентам
    this.server.emit('broadcast', {
      type: 'broadcast',
      message: `Broadcast: ${data.message}`,
      from: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      message: 'pong',
      timestamp: new Date().toISOString(),
    });
  }
}

