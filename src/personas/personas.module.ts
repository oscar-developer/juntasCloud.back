import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { PersonaFichaService } from './persona-ficha.service';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';

@Module({
  controllers: [PersonasController],
  providers: [PersonasService, PersonaFichaService, RolesGuard, TenantMembershipGuard],
})
export class PersonasModule {}
