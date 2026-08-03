import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { AsambleasController } from './asambleas.controller';
import { AsambleasService } from './asambleas.service';

@Module({
  controllers: [AsambleasController],
  providers: [AsambleasService, RolesGuard, TenantMembershipGuard],
})
export class AsambleasModule {}
