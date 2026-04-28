import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { TopController } from './top.controller';
import { TopService } from './top.service';

@Module({
  controllers: [TopController],
  providers: [TopService, RolesGuard, TenantMembershipGuard],
})
export class TopModule {}
