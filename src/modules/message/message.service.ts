import {
  ForbiddenException,
  NotFoundException,
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { ChatGateway } from '../chat/chat.gateway';
import { SendMessageType } from './message.schema';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  constructor(
    private readonly messageRepository: MessageRepository,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Send message: save to DB + emit real-time via WebSocket
   */
  async sendMessage(senderId: string, data: SendMessageType) {
    // 1. Save to DB
    const message = await this.messageRepository.create(senderId, data);

    this.logger.log(
      `Message created: ${message.id} in conversation ${data.conversationId}`,
    );

    return message;
  }

  /**
   * Get message history
   */
  async getMessages(conversationId: string, page: number, limit: number) {
    return await this.messageRepository.findByConversation(
      conversationId,
      page,
      limit,
    );
  }

  /**
   * Delete message (soft delete) - only sender can delete
   */
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.softDelete(messageId);

    // Emit event to conversation that message has been deleted
    this.chatGateway.emitToConversation(
      message.conversationId,
      'messageDeleted',
      { messageId },
    );

    return { message: 'Message deleted' };
  }
}
