import {
  Injectable,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import {
  RefreshTokenBodyType,
  RefreshTokenResponseType,
  SignInBodyType,
  SignInResponseType,
  SignOutBodyType,
  SignUpBodyType,
  SignUpResponseType,
} from './user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SessionRepository } from './session.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tạo user mới
   * - Kiểm tra email đã tồn tại chưa
   * - Tạo user trong database
   * @param data - Dữ liệu tạo user (email, name)
   * @returns UserPayload - User vừa tạo (id, email, name, createdAt, updatedAt)
   * @throws ConflictException - Nếu email đã tồn tại (409)
   */
  async signUp(data: SignUpBodyType): Promise<SignUpResponseType> {
    this.logger.log(`Creating user with email: ${data.email}`);

    // Check if email already exists
    const existingUserByEmail = await this.userRepository.findOne({
      email: data.email,
    });
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUserByUsername = await this.userRepository.findOne({
      username: data.username,
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(data.hashedPassword, 10);

    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      hashedPassword,
    });

    this.logger.log(`User created successfully: ${user.username}`);

    return user;
  }

  async signIn(data: SignInBodyType): Promise<SignInResponseType> {
    this.logger.log(`Signing in user with email: ${data.email}`);
    // check email
    const user = await this.userRepository.findByEmailWithPassword(data.email);

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    // generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN'),
      ),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });

    // save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

    await this.sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt,
    });
    this.logger.log(`User signed in successfully: ${user.email}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Sign out
  async signOut(userId: string, data: SignOutBodyType): Promise<void> {
    this.logger.log(`Signing out user with id: ${userId}`);

    // Find session by refresh token
    const session = await this.sessionRepository.findByRefreshToken(
      data.refreshToken,
    );

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if session is user's session
    if (session.userId !== userId) {
      throw new UnauthorizedException(
        'Refresh token does not belong to this user',
      );
    }

    // Delete session
    await this.sessionRepository.deleteById(session.id);
    this.logger.log(`User signed out successfully: ${userId}`);
  }

  // Refresh Token
  async refreshToken(
    data: RefreshTokenBodyType,
  ): Promise<RefreshTokenResponseType> {
    this.logger.log('Processing refresh token request');

    // 1. Verify JWT signature of refresh token
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(data.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // 2. Check if refresh token exists in database
    const session = await this.sessionRepository.findByRefreshToken(
      data.refreshToken,
    );

    if (!session) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // 3. Check if session has expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await this.sessionRepository.deleteById(session.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 4. Check if session belongs to the user in the token
    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token does not match user');
    }

    // 5. Generate new tokens
    const newPayload = {
      sub: payload.sub,
      email: payload.email,
    };

    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN'),
      ),
    });

    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: Number(
        this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });

    // 6. Rotate: update session with new refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.sessionRepository.updateRefreshToken(
      session.id,
      newRefreshToken,
      newExpiresAt,
    );

    this.logger.log(`Token refreshed successfully for user: ${payload.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
