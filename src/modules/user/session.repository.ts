import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // create new session
  async create(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }) {
    return await this.prisma.session.create({ data });
  }

  // Find session by refresh token
  async findByRefreshToken(refreshToken: string) {
    return await this.prisma.session.findUnique({ where: { refreshToken } });
  }

  //  Delete session by id
  async deleteById(id: string) {
    return await this.prisma.session.delete({ where: { id } });
  }

  // Delete session by user id
  async deleteByUserId(userId: string) {
    return await this.prisma.session.deleteMany({ where: { userId } });
  }

  // Update refresh token
  async updateRefreshToken(
    id: string,
    newRefreshToken: string,
    newExpiresAt: Date,
  ) {
    return await this.prisma.session.update({
      where: { id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });
  }
}
