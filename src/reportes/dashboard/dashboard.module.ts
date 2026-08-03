import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, RolesGuard, TenantMembershipGuard],
})
export class DashboardModule {}
