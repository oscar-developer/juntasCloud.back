import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { TerrenosController } from './terrenos.controller';
import { TerrenosService } from './terrenos.service';

@Module({
  controllers: [TerrenosController],
  providers: [TerrenosService, RolesGuard, TenantMembershipGuard],
})
export class TerrenosModule {}
