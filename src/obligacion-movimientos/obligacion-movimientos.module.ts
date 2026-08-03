import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { ObligacionMovimientosController } from './obligacion-movimientos.controller';
import { ObligacionMovimientosService } from './obligacion-movimientos.service';

@Module({
  controllers: [ObligacionMovimientosController],
  providers: [ObligacionMovimientosService, RolesGuard, TenantMembershipGuard],
})
export class ObligacionMovimientosModule {}
