import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { DeudasPersonaController } from './deudas-persona.controller';
import { DeudasPersonaService } from './deudas-persona.service';

@Module({
  controllers: [DeudasPersonaController],
  providers: [DeudasPersonaService, RolesGuard, TenantMembershipGuard],
})
export class DeudasPersonaModule {}
