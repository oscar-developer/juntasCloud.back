import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { ConceptosCobroController } from './conceptos-cobro.controller';
import { ConceptosCobroService } from './conceptos-cobro.service';

@Module({
  controllers: [ConceptosCobroController],
  providers: [ConceptosCobroService, RolesGuard, TenantMembershipGuard],
})
export class ConceptosCobroModule {}
