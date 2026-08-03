import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { ObligacionPagosController } from './obligacion-pagos.controller';
import { ObligacionPagosService } from './obligacion-pagos.service';

@Module({
  controllers: [ObligacionPagosController],
  providers: [ObligacionPagosService, RolesGuard, TenantMembershipGuard],
})
export class ObligacionPagosModule {}
