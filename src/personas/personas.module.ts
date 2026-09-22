import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { PersonaFichaService } from './persona-ficha.service';
import { PersonaConstanciasPublicController } from './persona-constancias-public.controller';
import { PersonaConstanciasService } from './persona-constancias.service';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';

@Module({
  controllers: [PersonasController, PersonaConstanciasPublicController],
  providers: [
    PersonasService,
    PersonaFichaService,
    PersonaConstanciasService,
    RolesGuard,
    TenantMembershipGuard,
  ],
})
export class PersonasModule {}
