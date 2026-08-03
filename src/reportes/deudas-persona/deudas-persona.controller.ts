import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../../common/auth/get-user-id-from-request';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { DeudasPersonaService } from './deudas-persona.service';

@ApiTags('reportes')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('reportes/personas')
export class DeudasPersonaController {
  constructor(private readonly service: DeudasPersonaService) {}

  @Get(':personaId/extracto')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener extracto consolidado de una persona' })
  @ApiParam({ name: 'personaId', type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getExtracto(@Param('personaId') personaId: string, @Req() req: Request): Promise<unknown> {
    return this.service.getExtracto(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(personaId, 'personaId'),
    );
  }

  @Get(':personaId/deuda')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener resumen de deuda de una persona' })
  @ApiParam({ name: 'personaId', type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getDeuda(@Param('personaId') personaId: string, @Req() req: Request): Promise<unknown> {
    return this.service.getDeuda(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(personaId, 'personaId'),
    );
  }

  @Get(':personaId/faenas')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener resumen de faenas de una persona' })
  @ApiParam({ name: 'personaId', type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getFaenas(@Param('personaId') personaId: string, @Req() req: Request): Promise<unknown> {
    return this.service.getFaenas(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(personaId, 'personaId'),
    );
  }

  @Get(':personaId/asambleas')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener resumen de asambleas de una persona' })
  @ApiParam({ name: 'personaId', type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getAsambleas(@Param('personaId') personaId: string, @Req() req: Request): Promise<unknown> {
    return this.service.getAsambleas(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(personaId, 'personaId'),
    );
  }
}
