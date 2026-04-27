import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { ReportesCajaController } from './reportes-caja.controller';
import { ReportesCajaService } from './reportes-caja.service';

@Module({
  controllers: [ReportesCajaController],
  providers: [ReportesCajaService, RolesGuard, TenantMembershipGuard],
})
export class ReportesCajaModule {}
