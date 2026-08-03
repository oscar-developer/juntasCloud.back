import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CajaCategoriasController } from './caja-categorias.controller';
import { CajaCategoriasService } from './caja-categorias.service';

@Module({
  controllers: [CajaCategoriasController],
  providers: [CajaCategoriasService, RolesGuard, TenantMembershipGuard],
})
export class CajaCategoriasModule {}
