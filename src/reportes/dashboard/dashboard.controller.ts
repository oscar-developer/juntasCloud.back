import { Controller, Get, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../../common/auth/get-user-id-from-request';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('reportes')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('reportes')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener dashboard general del tenant activo' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getDashboard(@Req() req: Request): Promise<unknown> {
    return this.service.getDashboardGeneral(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
    );
  }
}
