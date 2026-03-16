import { forwardRef, Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageRepository } from './message.repository';
import { PrismaService } from '@/database/prisma.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository, PrismaService],
  exports: [MessageService],
})
export class MessageModule {}
