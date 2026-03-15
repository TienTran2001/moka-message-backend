import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationRepository } from './conversation.repository';
import { PrismaService } from '@/database/prisma.service';
import { ChatModule } from '@/modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationRepository, PrismaService],
  exports: [ConversationService],
})
export class ConversationModule {}
