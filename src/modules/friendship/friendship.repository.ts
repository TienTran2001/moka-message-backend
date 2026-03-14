import { PrismaService } from '@/database/prisma.service';
import { FriendshipStatus } from '@/generated/prisma/enums';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Send friendship request
  async createFriendRequest(userId: string, friendId: string) {
    return await this.prisma.$transaction([
      this.prisma.friendship.create({
        data: { userId, friendId, status: FriendshipStatus.REQUESTED },
      }),
      this.prisma.friendship.create({
        data: {
          userId: friendId,
          friendId: userId,
          status: FriendshipStatus.PENDING,
        },
      }),
    ]);
  }

  // accept friendship request - update all 2 records to ACCEPTED
  async acceptFriendRequest(userId: string, friendId: string) {
    return await this.prisma.$transaction([
      this.prisma.friendship.update({
        where: { userId_friendId: { userId, friendId } },
        data: { status: FriendshipStatus.ACCEPTED },
      }),
      this.prisma.friendship.update({
        where: { userId_friendId: { userId: friendId, friendId: userId } },
        data: { status: FriendshipStatus.ACCEPTED },
      }),
    ]);
  }

  // reject friendship request - delete both records
  async removeFriendship(userId: string, friendId: string) {
    return await this.prisma.$transaction([
      this.prisma.friendship.delete({
        where: { userId_friendId: { userId, friendId } },
      }),
      this.prisma.friendship.delete({
        where: { userId_friendId: { userId: friendId, friendId: userId } },
      }),
    ]);
  }

  // Get friends of a user (ACCEPTED) - Where userId
  async findFriends(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.friendship.findMany({
        where: { userId, status: FriendshipStatus.ACCEPTED },
        include: {
          friend: {
            omit: { hashedPassword: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendship.count({
        where: { userId, status: FriendshipStatus.ACCEPTED },
      }),
    ]);

    return { items, total, page, limit };
  }

  // Get friends of a user is Pending - Where userId
  async findPendingRequests(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.friendship.findMany({
        where: { userId, status: FriendshipStatus.PENDING },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendship.count({
        where: { userId, status: FriendshipStatus.PENDING },
      }),
    ]);

    return { items, total, page, limit };
  }

  // Find relationship between 2 user
  async findOne(userId: string, friendId: string) {
    return await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });
  }
}
