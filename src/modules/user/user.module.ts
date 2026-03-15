import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { PrismaService } from '@/database/prisma.service';
import { SessionRepository } from './session.repository';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, UserRepository, PrismaService, SessionRepository],
  exports: [UserService],
})
export class UserModule {}
