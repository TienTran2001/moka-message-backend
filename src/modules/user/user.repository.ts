import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SignUpBodyType, UserType } from './user.schema';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo user mới trong database
   * @param data - Dữ liệu tạo user (email, username, displayName, hashedPassword)
   * @returns UserPayload - User
   */

  async create(
    data: Omit<SignUpBodyType, 'confirmPassword'>,
  ): Promise<UserType> {
    return (await this.prisma.user.create({
      data,
      omit: {
        hashedPassword: true,
      },
    })) as unknown as Promise<UserType>;
  }

  /**
   * Tìm user theo email hoặc username
   * @param email - Email cần tìm (optional)
   * @param username - Username cần tìm (optional)
   * @returns UserType | null - User nếu tìm thấy, null nếu không
   */
  async findOne({
    email,
    username,
  }: {
    email?: string;
    username?: string;
  }): Promise<UserType | null> {
    const conditions = [];
    if (email) conditions.push({ email });
    if (username) conditions.push({ username });

    if (conditions.length === 0) return null;

    return (await this.prisma.user.findFirst({
      where: { OR: conditions },
      omit: {
        hashedPassword: true,
      },
    })) as unknown as Promise<UserType | null>;
  }
}
