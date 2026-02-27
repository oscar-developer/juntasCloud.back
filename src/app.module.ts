import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthUsersModule } from './auth-users/auth-users.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';

@Module({  
  imports: [PrismaModule, AuthUsersModule, TenantsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
