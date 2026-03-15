import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from './chat.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client disconnected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      // Attach user data to socket
      client.data.user = payload;

      // Join room by userId to easily send private messages
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client connected: ${payload.sub} (${client.id})`);
    } catch {
      this.logger.warn(`Client disconnected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client join to conversation room
   * Client send: socket.emit('joinConversation', { conversationId: '...' })
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.data.user.sub} joined conversation:${data.conversationId}`,
    );
    return {
      event: 'joinedConversation',
      data: { conversationId: data.conversationId },
    };
  }

  /**
   * Client leave conversation room
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.data.user.sub} left conversation:${data.conversationId}`,
    );
    return {
      event: 'leftConversation',
      data: { conversationId: data.conversationId },
    };
  }

  /**
   * Client send message
   * Client send: socket.emit('sendMessage', { conversationId: '...', content: '...' })
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.user.sub;

    // Emit to all users in conversation (except sender)
    client.to(`conversation:${data.conversationId}`).emit('newMessage', {
      conversationId: data.conversationId,
      senderId: userId,
      content: data.content,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(
      `Message from ${userId} to conversation:${data.conversationId}`,
    );

    return { event: 'messageSent', data: { status: 'ok' } };
  }

  /**
   * Helper: Emit event to a specific user (used from other service)
   */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Helper: Emit event to a conversation (used from other service)
   */
  emitToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
