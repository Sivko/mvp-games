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
import { SearchWordService } from './games/search-word/search-word.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly searchWordService: SearchWordService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Обновляем количество пользователей во всех комнатах, из которых отключился клиент
    const rooms = Array.from(client.rooms);
    rooms.forEach((roomName) => {
      if (roomName.startsWith('room:')) {
        const roomId = roomName.replace('room:', '');
        const room = this.server.sockets.adapter.rooms.get(roomName);
        const usersCount = room ? room.size : 0;
        
        // Отправляем обновление количества пользователей всем в комнате
        this.server.to(roomName).emit('users-count-updated', {
          roomId,
          count: usersCount,
        });
      }
    });
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
    
    // Инициализируем отслеживание нотификаций для игры search-word
    this.searchWordService.initializeNotifications(roomId);
    
    // Получаем количество пользователей в комнате
    const room = this.server.sockets.adapter.rooms.get(`room:${roomId}`);
    const usersCount = room ? room.size : 0;
    
    // Отправляем подтверждение клиенту
    client.emit('room-joined', { roomId });
    
    // Отправляем обновление количества пользователей всем в комнате
    this.server.to(`room:${roomId}`).emit('users-count-updated', {
      roomId,
      count: usersCount,
    });
  }

  @SubscribeMessage('add-word')
  async handleAddWord(
    @MessageBody() data: { roomId: string; word: string; user: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, word, user } = data;
    await this.searchWordService.handleAddWord(
      this.server,
      roomId,
      word,
      user,
      client.id,
    );
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

