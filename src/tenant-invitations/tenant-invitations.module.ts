import { Module } from '@nestjs/common';
import { TenantInvitationsController } from './tenant-invitations.controller';
import { TenantInvitationsService } from './tenant-invitations.service';

@Module({
  controllers: [TenantInvitationsController],
  providers: [TenantInvitationsService],
})
export class TenantInvitationsModule {}
