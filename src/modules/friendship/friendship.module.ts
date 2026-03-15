import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { FriendshipRepository } from './friendship.repository';
import { PrismaService } from '@/database/prisma.service';

@Module({
  imports: [],
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipRepository, PrismaService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
