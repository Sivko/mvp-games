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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Отправляем приветственное сообщение новому клиенту
    client.emit('message', {
      type: 'connection',
      message: 'Connected to WebSocket server',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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

