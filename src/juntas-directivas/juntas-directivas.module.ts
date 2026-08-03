import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { JuntasDirectivasController } from './juntas-directivas.controller';
import { JuntasDirectivasService } from './juntas-directivas.service';

@Module({
  controllers: [JuntasDirectivasController],
  providers: [JuntasDirectivasService, RolesGuard, TenantMembershipGuard],
})
export class JuntasDirectivasModule {}
