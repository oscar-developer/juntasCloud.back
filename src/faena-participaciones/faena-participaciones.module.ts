import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { FaenaParticipacionesController } from './faena-participaciones.controller';
import { FaenaParticipacionesService } from './faena-participaciones.service';

@Module({
  controllers: [FaenaParticipacionesController],
  providers: [FaenaParticipacionesService, RolesGuard, TenantMembershipGuard],
})
export class FaenaParticipacionesModule {}
