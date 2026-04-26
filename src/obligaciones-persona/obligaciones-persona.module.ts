import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { ObligacionesPersonaController } from './obligaciones-persona.controller';
import { ObligacionesPersonaService } from './obligaciones-persona.service';

@Module({
  controllers: [ObligacionesPersonaController],
  providers: [ObligacionesPersonaService, RolesGuard, TenantMembershipGuard],
})
export class ObligacionesPersonaModule {}
