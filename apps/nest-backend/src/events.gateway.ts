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
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
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

  constructor(
    private readonly roomService: RoomService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

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

      // Вычисляем similarity через Python API
      let similarity: number;
      try {
        const pythonApiUrl = this.configService.get<string>('PYTHON_API_URL', 'http://localhost:8000');
        const response = await firstValueFrom(
          this.httpService.post(`${pythonApiUrl}/similarity`, {
            sourceWord: room.sourceWord,
            word: word,
          }),
        );
        
        if (response.data.status === 200 && typeof response.data.similarity === 'number') {
          similarity = response.data.similarity;
        } else {
          console.error('Invalid response from Python API:', response.data);
          similarity = 0;
        }
      } catch (error) {
        console.error('Error calling Python API:', error);
        // В случае ошибки используем значение по умолчанию
        similarity = 0;
      }

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
      // this.server.to(`room:${roomId}`).emit('room-updated', {
      //   room: updatedRoom.toObject(),
      // });
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

