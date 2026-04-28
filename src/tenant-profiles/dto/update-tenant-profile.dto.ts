import { PartialType } from '@nestjs/swagger';
import { CreateTenantProfileDto } from './create-tenant-profile.dto';

export class UpdateTenantProfileDto extends PartialType(CreateTenantProfileDto) {}
