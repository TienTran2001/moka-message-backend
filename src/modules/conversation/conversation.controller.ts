import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  CreateConversationSchema,
  CreateConversationType,
} from './conversation.schema';

@Controller('/v1/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * POST /api/v1/conversations - create new conversation
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(CreateConversationSchema))
    body: CreateConversationType,
  ) {
    return await this.conversationService.createConversation(userId, body);
  }
}
