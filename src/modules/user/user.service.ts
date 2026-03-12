import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { SignUpBodyType, SignUpResponseType } from './user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

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

    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      hashedPassword: data.hashedPassword,
    });

    this.logger.log(`User created successfully: ${user.username}`);

    return user;
  }
}
