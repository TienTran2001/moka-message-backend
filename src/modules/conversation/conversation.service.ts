import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { CreateConversationType } from './conversation.schema';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createConversation(userId: string, data: CreateConversationType) {
    // 1. Not allow yourself to create conversation
    if (data.memberIds.includes(userId)) {
      throw new BadRequestException('Cannot add yourself to members');
    }

    // 2. Remove duplicate userIds
    const uniqueMemberIds = [...new Set(data.memberIds)];

    // 3. Branching by conversation type
    if (data.type === 'DIRECT') {
      return this.createDirectConversation(userId, uniqueMemberIds[0]);
    }

    return this.createGroupConversation(userId, uniqueMemberIds, data.name);
  }

  // DIRECT: Find existing -> Create if not exist
  private async createDirectConversation(
    userId: string,
    participantId: string,
  ) {
    this.logger.log(
      `Finding/creating direct conversation: ${userId} ↔ ${participantId}`,
    );

    // Find conversation existed
    const existing = await this.conversationRepository.findDirectConversation(
      userId,
      participantId,
    );

    if (existing) {
      this.logger.log(`Direct conversation found: ${existing.id}`);
      return existing;
    }
    const conversation =
      await this.conversationRepository.createDirectConversation(
        userId,
        participantId,
      );

    this.logger.log(`Direct conversation created: ${conversation.id}`);
    return conversation;
  }

  // GROUP: Create new conversation
  private async createGroupConversation(
    creatorId: string,
    memberIds: string[],
    name: string,
  ) {
    this.logger.log(
      `Creating group conversation: "${name}" with ${memberIds.length + 1} members`,
    );

    const conversation =
      await this.conversationRepository.createGroupConversation(
        creatorId,
        memberIds,
        name,
      );

    this.logger.log(`Group conversation created: ${conversation.id}`);

    for (const memberId of memberIds) {
      this.chatGateway.emitToUser(memberId, 'newConversation', {
        conversationId: conversation.id,
        name,
        type: 'GROUP',
      });
    }
    return conversation;
  }
}
