import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { AsistenciaAsambleaController } from './asistencia-asamblea.controller';
import { AsistenciaAsambleaService } from './asistencia-asamblea.service';

@Module({
  controllers: [AsistenciaAsambleaController],
  providers: [AsistenciaAsambleaService, RolesGuard, TenantMembershipGuard],
})
export class AsistenciaAsambleaModule {}
