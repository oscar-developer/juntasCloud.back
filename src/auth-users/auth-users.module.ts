import { Module } from '@nestjs/common';
import { AuthUsersController } from './auth-users.controller';
import { AuthUsersService } from './auth-users.service';

@Module({
  controllers: [AuthUsersController],
  providers: [AuthUsersService],
})
export class AuthUsersModule {}
