import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { PersonaTerrenosController } from './persona-terrenos.controller';
import { PersonaTerrenosService } from './persona-terrenos.service';

@Module({
  controllers: [PersonaTerrenosController],
  providers: [PersonaTerrenosService, RolesGuard, TenantMembershipGuard],
})
export class PersonaTerrenosModule {}
