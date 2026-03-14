import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  FriendIdParamSchema,
  FriendIdParamType,
  FriendshipQuerySchema,
  FriendshipQueryType,
} from './friendship.schema';

@Controller('/v1/friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /**
   * POST /api/v1/friendships/request — Gửi lời mời kết bạn
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(FriendIdParamSchema))
    body: FriendIdParamType,
  ) {
    return await this.friendshipService.sendFriendRequest(
      userId,
      body.friendId,
    );
  }

  /**
   * POST /api/v1/friendships/accept — Chấp nhận lời mời
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async acceptFriendRequest(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(FriendIdParamSchema))
    body: FriendIdParamType,
  ) {
    return await this.friendshipService.acceptFriendRequest(
      userId,
      body.friendId,
    );
  }

  /**
   * DELETE /api/v1/friendships/remove — Từ chối / Hủy lời mời / Hủy kết bạn
   */
  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  async removeFriendship(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(FriendIdParamSchema))
    body: FriendIdParamType,
  ) {
    return await this.friendshipService.removeFriendship(userId, body.friendId);
  }

  /**
   * GET /api/v1/friendships?page=1&limit=20 — Danh sách bạn bè
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getFriends(
    @CurrentUser('sub') userId: string,
    @Query(new ZodValidationPipe(FriendshipQuerySchema))
    query: FriendshipQueryType,
  ) {
    return await this.friendshipService.getFriends(
      userId,
      query.page,
      query.limit,
    );
  }

  /**
   * GET /api/v1/friendships/pending?page=1&limit=20 — Lời mời đang chờ
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async getPendingRequests(
    @CurrentUser('sub') userId: string,
    @Query(new ZodValidationPipe(FriendshipQuerySchema))
    query: FriendshipQueryType,
  ) {
    return await this.friendshipService.getPendingRequests(
      userId,
      query.page,
      query.limit,
    );
  }
}
