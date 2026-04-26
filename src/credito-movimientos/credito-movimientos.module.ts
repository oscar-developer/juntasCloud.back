import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CreditoMovimientosController } from './credito-movimientos.controller';
import { CreditoMovimientosService } from './credito-movimientos.service';

@Module({
  controllers: [CreditoMovimientosController],
  providers: [CreditoMovimientosService, RolesGuard, TenantMembershipGuard],
})
export class CreditoMovimientosModule {}
