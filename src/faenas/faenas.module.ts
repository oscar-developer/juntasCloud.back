import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { FaenasController } from './faenas.controller';
import { FaenasService } from './faenas.service';

@Module({
  controllers: [FaenasController],
  providers: [FaenasService, RolesGuard, TenantMembershipGuard],
})
export class FaenasModule {}
