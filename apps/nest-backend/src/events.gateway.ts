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

  // Отслеживание показанных нотификаций для каждой комнаты
  // Ключ: roomId, значение: Set с ranges, для которых уже была показана нотификация
  private readonly shownNotifications = new Map<string, Set<number>>();

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
    
    // Инициализируем отслеживание нотификаций для комнаты, если еще не инициализировано
    if (!this.shownNotifications.has(roomId)) {
      this.shownNotifications.set(roomId, new Set());
    }
    
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

  /**
   * Проверяет, есть ли уже слово со средним сходством в комнате
   */
  private async hasMediumSimilarityWord(roomId: string): Promise<boolean> {
    const room = await this.roomService.findById(roomId);
    if (!room || !room.searchWord || !room.searchWord.linkingWords) {
      return false;
    }

    const linkingWords = room.searchWord.linkingWords;
    console.log(`[Notification] Checking for existing medium similarity words in room ${roomId}, linkingWords type:`, linkingWords?.constructor?.name);
    
    if (linkingWords instanceof Map) {
      console.log(`[Notification] linkingWords is Map with size: ${linkingWords.size}`);
      for (const [word, wordData] of linkingWords) {
        const similarity = wordData.similarity;
        console.log(`[Notification] Word "${word}" has similarity: ${similarity}`);
        // Среднее сходство: 0.5 < similarity <= 0.7
        if (similarity > 0.5 && similarity <= 0.7) {
          console.log(`[Notification] Found existing medium similarity word "${word}" with similarity ${similarity}`);
          return true;
        }
      }
    } else {
      console.log(`[Notification] linkingWords is not a Map, it's:`, typeof linkingWords);
    }

    return false;
  }

  /**
   * Проверяет, является ли similarity средним сходством (0.5 < similarity <= 0.7)
   */
  private isMediumSimilarity(similarity: number): boolean {
    return similarity > 0.4 && similarity <= 0.7;
  }

  private shouldSkipSimilarityCheck(word: string): boolean {
    // Проверка на несколько слов (разделенных пробелами)
    const words = word.trim().split(/\s+/);
    if (words.length > 1) {
      return true;
    }

    // Проверка на эмодзи (основные Unicode диапазоны эмодзи)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{200D}]|[\u{203C}]|[\u{2049}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267E}-\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}-\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/u;
    if (emojiRegex.test(word)) {
      return true;
    }

    // Проверка на наличие цифры и специального знака одновременно
    const hasDigit = /\d/.test(word);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(word);
    if (hasDigit && hasSpecialChar) {
      return true;
    }

    return false;
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

      // Проверяем, нужно ли пропустить проверку сходства
      const skipSimilarityCheck = this.shouldSkipSimilarityCheck(word);
      
      // Вычисляем similarity через Python API (только если не нужно пропустить проверку)
      let similarity: number = 0;
      if (!skipSimilarityCheck) {
        try {
          const pythonApiUrl = this.configService.get<string>('PYTHON_API_URL', 'http://localhost:8000');
          const response = await firstValueFrom(
            this.httpService.post(`${pythonApiUrl}/similarity`, {
              sourceWord: room.searchWord?.sourceWord || '',
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
      }

      // Добавляем слово в комнату только если similarity > 0
      if (similarity > 0) {
        // Проверяем, нужно ли показать нотификацию для среднего сходства
        // Показываем только если это первое слово в диапазоне 0.5 < similarity <= 0.7
        // ВАЖНО: Проверяем существующие слова ПЕРЕД добавлением нового слова
        let shouldShowNotification = false;
        if (this.isMediumSimilarity(similarity)) {
          console.log(`[Notification] Medium similarity detected: ${similarity} for room ${roomId}`);
          
          // Проверяем, есть ли уже слово со средним сходством в базе
          const hasExistingMediumSimilarity = await this.hasMediumSimilarityWord(roomId);
          console.log(`[Notification] Has existing medium similarity word: ${hasExistingMediumSimilarity}`);
          
          if (!hasExistingMediumSimilarity) {
            shouldShowNotification = true;
            console.log(`[Notification] Will show notification for room ${roomId}, user: ${user?.name || 'Неизвестный'}`);
            
            // Инициализируем отслеживание и отмечаем, что нотификация будет показана
            if (!this.shownNotifications.has(roomId)) {
              this.shownNotifications.set(roomId, new Set());
            }
            const shownRanges = this.shownNotifications.get(roomId);
            shownRanges?.add(0.7);
            console.log(`[Notification] Added 0.7 to shownRanges`);
          } else {
            console.log(`[Notification] Notification already shown - existing word found`);
          }
        } else {
          console.log(`[Notification] Similarity ${similarity} is not medium similarity (should be > 0.5 and <= 0.7)`);
        }
        
        console.log(`[Notification] shouldShowNotification = ${shouldShowNotification}`);

        // Теперь добавляем слово в базу
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

        // Показываем нотификацию после успешного добавления слова
        if (shouldShowNotification) {
          console.log(`[Notification] Emitting show-notification event to room ${roomId}`);
          this.server.to(`room:${roomId}`).emit('show-notification', {
            type: 'medium-similarity',
            userName: user?.name || 'Неизвестный',
            similarity: similarity,
          });
          console.log(`[Notification] Event emitted successfully`);
        } else {
          console.log(`[Notification] Not emitting event - shouldShowNotification is false`);
        }
      }

      // Отправляем обновление всем клиентам в комнате (всегда, независимо от similarity)
      this.server.to(`room:${roomId}`).emit('word-added', {
        word,
        similarity,
        user,
        isCustomMessage: skipSimilarityCheck,
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

