import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SendMessageType } from './message.schema';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create message + update lastMessage on Conversation (transaction)
   */
  async create(senderId: string, data: SendMessageType) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create message
      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          type: data.type,
          content: data.content,
          fileUrl: data.fileUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // 2. Update lastMessage + lastMessageAt on Conversation
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      return message;
    });
  }

  /**
   * Get message history (paging, newest first)
   */
  async findByConversation(
    conversationId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: {
          conversationId,
          deletedAt: null, // Ignore deleted messages (soft delete)
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          deletedAt: null,
        },
      }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Soft delete message
   */
  async softDelete(messageId: string) {
    return await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Find message by id
   */
  async findById(messageId: string) {
    return await this.prisma.message.findUnique({
      where: { id: messageId },
    });
  }
}
