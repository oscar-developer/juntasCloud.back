import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { JuntaMiembrosController } from './junta-miembros.controller';
import { JuntaMiembrosService } from './junta-miembros.service';

@Module({
  controllers: [JuntaMiembrosController],
  providers: [JuntaMiembrosService, RolesGuard, TenantMembershipGuard],
})
export class JuntaMiembrosModule {}
