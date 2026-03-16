import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { GetMessagesQuerySchema, GetMessagesQueryType } from './message.schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('/v1/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * POST /api/v1/messages - Send message
   */
  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // async sendMessage(
  //   @CurrentUser('sub') userId: string,
  //   @Body(new ZodValidationPipe(SendMessageSchema))
  //   body: SendMessageType,
  // ) {
  //   return await this.messageService.sendMessage(userId, body);
  // }

  /**
   * GET /api/v1/messages?conversationId=xxx&page=1&limit=20 - Message history
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Query(new ZodValidationPipe(GetMessagesQuerySchema))
    query: GetMessagesQueryType,
  ) {
    return await this.messageService.getMessages(
      query.conversationId,
      query.page,
      query.limit,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') messageId: string,
  ) {
    return await this.messageService.deleteMessage(userId, messageId);
  }
}
