import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CreditosPersonaController } from './creditos-persona.controller';
import { CreditosPersonaService } from './creditos-persona.service';

@Module({
  controllers: [CreditosPersonaController],
  providers: [CreditosPersonaService, RolesGuard, TenantMembershipGuard],
})
export class CreditosPersonaModule {}
