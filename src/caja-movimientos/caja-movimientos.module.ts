import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CajaMovimientosController } from './caja-movimientos.controller';
import { CajaMovimientosService } from './caja-movimientos.service';

@Module({
  controllers: [CajaMovimientosController],
  providers: [CajaMovimientosService, RolesGuard, TenantMembershipGuard],
})
export class CajaMovimientosModule {}
