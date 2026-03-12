import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  SignInBodySchema,
  SignInBodyType,
  SignInResponseType,
  SignOutBodySchema,
  SignOutBodyType,
  SignUpBodySchema,
  SignUpBodyType,
  SignUpResponseType,
} from './user.schema';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /api/v1/users/auth/sign-up — đăng ký tài khoản
   */
  @Post('auth/sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body(new ZodValidationPipe(SignUpBodySchema))
    body: SignUpBodyType,
  ): Promise<SignUpResponseType> {
    return await this.userService.signUp(body);
  }

  /**
   * POST /api/v1/users/auth/sign-in
   */
  @Post('auth/sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body(new ZodValidationPipe(SignInBodySchema))
    body: SignInBodyType,
  ): Promise<SignInResponseType> {
    return await this.userService.signIn(body);
  }

  /**
   * POST /api/v1/users/auth/sign-out
   */
  @Post('auth/sign-out')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(SignOutBodySchema))
    body: SignOutBodyType,
  ): Promise<void> {
    return await this.userService.signOut(userId, body);
  }
}
