import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  SignUpBodySchema,
  SignUpBodyType,
  SignUpResponseType,
} from './user.schema';

@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /api/v1/auth/sign-up — đăng ký tài khoản
   */
  @Post('auth/sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body(new ZodValidationPipe(SignUpBodySchema))
    body: SignUpBodyType,
  ): Promise<SignUpResponseType> {
    return await this.userService.signUp(body);
  }
}
