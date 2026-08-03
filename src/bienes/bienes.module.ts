import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { BienesController } from './bienes.controller';
import { BienesService } from './bienes.service';

@Module({
  controllers: [BienesController],
  providers: [BienesService, RolesGuard, TenantMembershipGuard],
})
export class BienesModule {}
