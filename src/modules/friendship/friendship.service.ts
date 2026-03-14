import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipRepository } from './friendship.repository';
import { FriendshipStatus } from '@/generated/prisma/enums';

@Injectable()
export class FriendshipService {
  private readonly logger = new Logger(FriendshipService.name);

  constructor(private readonly friendshipRepository: FriendshipRepository) {}

  async sendFriendRequest(userId: string, friendId: string) {
    // 1. Not allowed to send friend request to yourself
    if (userId === friendId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // 2. Check relationship (userId -> friendId)
    const existing = await this.friendshipRepository.findOne(userId, friendId);

    if (existing) {
      switch (existing.status) {
        case FriendshipStatus.ACCEPTED:
          throw new ConflictException('Already friends');
        case FriendshipStatus.REQUESTED:
          throw new ConflictException('Friend request already sent');
        case FriendshipStatus.PENDING:
          this.logger.log(
            `Mutual friend request detected: ${userId} ↔ ${friendId}, auto accepting`,
          );
          await this.friendshipRepository.acceptFriendRequest(userId, friendId);
          return { message: 'Friend request accepted (mutual request)' };

        case FriendshipStatus.BLOCKED:
          throw new ForbiddenException('Cannot send friend request');
      }
    }

    // 3. Create friend request
    await this.friendshipRepository.createFriendRequest(userId, friendId);
    return { message: 'Friend request sent' };
  }

  // Accept friend request
  async acceptFriendRequest(userId: string, friendId: string) {
    const existing = await this.friendshipRepository.findOne(userId, friendId);

    if (!existing) {
      throw new NotFoundException('Friend request not found');
    }

    if (existing.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('No pending friend request to accept');
    }

    await this.friendshipRepository.acceptFriendRequest(userId, friendId);
    return { message: 'Friend request accepted' };
  }

  // Reject friend request
  async removeFriendship(userId: string, friendId: string) {
    const existing = await this.friendshipRepository.findOne(userId, friendId);

    if (!existing) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendshipRepository.removeFriendship(userId, friendId);
    return { message: 'Friendship removed' };
  }

  // Get friends of a user is Accepted
  async getFriends(userId: string, page: number, limit: number) {
    return await this.friendshipRepository.findFriends(userId, page, limit);
  }

  // Get friends of a user is Pending
  async getPendingRequests(userId: string, page: number, limit: number) {
    return await this.friendshipRepository.findPendingRequests(
      userId,
      page,
      limit,
    );
  }
}
