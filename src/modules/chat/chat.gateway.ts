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
import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from './chat.guard';
import { MessageService } from '../message/message.service';

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
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE';
      fileUrl?: string;
    },
  ) {
    const userId = client.data.user.sub;

    // Save to DB + emit to conversation room
    const message = await this.messageService.sendMessage(userId, {
      conversationId: data.conversationId,
      type: data.type ?? 'TEXT',
      content: data.content,
      fileUrl: data.fileUrl,
    });

    // Emit to the conversation room
    client
      .to(`conversation:${data.conversationId}`)
      .emit('newMessage', message);

    // Emit to the client who sent the message
    client.emit('messageSent', message);
    this.logger.log(`Message sent to conversation:${data.conversationId}`);
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
