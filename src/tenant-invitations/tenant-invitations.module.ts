import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TenantInvitationsController } from './tenant-invitations.controller';
import { TenantInvitationsService } from './tenant-invitations.service';

@Module({
  imports: [MailModule],
  controllers: [TenantInvitationsController],
  providers: [TenantInvitationsService],
})
export class TenantInvitationsModule {}
