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
  ) {}

  handleConnection(client: Socket) {
    console.log('=== EventsGateway Connection ===');
    console.log(`Client ID: ${client.id}`);
    console.log(`Connection URL: ${client.request.url}`);
    console.log(`Namespace: ${client.nsp.name}`);
    console.log('=================================');
  }

  handleDisconnect(client: Socket) {
    console.log('=== EventsGateway Disconnection ===');
    console.log(`Client ID: ${client.id}`);
    console.log(`Namespace: ${client.nsp.name}`);
    console.log('===================================');
  }
}

