import { Module } from '@nestjs/common';
import { TenantProfilesController } from './tenant-profiles.controller';
import { TenantProfilesService } from './tenant-profiles.service';

@Module({
  controllers: [TenantProfilesController],
  providers: [TenantProfilesService],
})
export class TenantProfilesModule {}
