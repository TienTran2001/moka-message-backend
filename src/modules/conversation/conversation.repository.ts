import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Find conversation between two users
  async findDirectConversation(userIdA: string, userIdB: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // create direct conversation + 2 participants (in transaction)
  async createDirectConversation(userIdA: string, userIdB: string) {
    return await this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          createMany: {
            data: [
              { userId: userIdA, role: 'MEMBER' },
              { userId: userIdB, role: 'MEMBER' },
            ],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create group conversation + participants (trong transaction)
   */
  async createGroupConversation(
    creatorId: string,
    memberIds: string[],
    name: string,
  ) {
    return await this.prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        createdById: creatorId,
        participants: {
          createMany: {
            data: [
              { userId: creatorId, role: 'ADMIN' },
              ...memberIds.map((id) => ({
                userId: id,
                role: 'MEMBER' as const,
              })),
            ],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
