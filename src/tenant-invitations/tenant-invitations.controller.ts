import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTenantInvitationDto } from './dto/create-tenant-invitation.dto';
import { TenantInvitationResponseDto } from './dto/tenant-invitation-response.dto';
import { TenantInvitationsService } from './tenant-invitations.service';

@ApiTags('tenant-invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TenantInvitationsController {
  constructor(private readonly tenantInvitationsService: TenantInvitationsService) {}

  @Post('tenants/:tenantId/invitations')
  @ApiOperation({ summary: 'Crear invitacion para un tenant' })
  @ApiParam({ name: 'tenantId', description: 'id_tenant del tenant destino' })
  @ApiCreatedResponse({ type: TenantInvitationResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateTenantInvitationDto,
    @Req() req: Request,
  ): Promise<TenantInvitationResponseDto> {
    return this.tenantInvitationsService.create(
      this.tenantInvitationsService.parseBigIntId(tenantId, 'tenantId'),
      this.getUserId(req),
      dto,
    );
  }

  @Get('me/invitations')
  @ApiOperation({ summary: 'Listar invitaciones pendientes del usuario autenticado' })
  @ApiOkResponse({ type: TenantInvitationResponseDto, isArray: true })
  listMine(@Req() req: Request): Promise<TenantInvitationResponseDto[]> {
    return this.tenantInvitationsService.listMine(this.getUserId(req));
  }

  @Post('me/invitations/:id/accept')
  @ApiOperation({ summary: 'Aceptar invitacion' })
  @ApiParam({ name: 'id', description: 'id_invitation de tenant_invitations' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  accept(@Param('id') id: string, @Req() req: Request): Promise<TenantInvitationResponseDto> {
    return this.tenantInvitationsService.accept(
      this.tenantInvitationsService.parseBigIntId(id, 'id'),
      this.getUserId(req),
    );
  }

  @Post('me/invitations/:id/reject')
  @ApiOperation({ summary: 'Rechazar invitacion' })
  @ApiParam({ name: 'id', description: 'id_invitation de tenant_invitations' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  reject(@Param('id') id: string, @Req() req: Request): Promise<TenantInvitationResponseDto> {
    return this.tenantInvitationsService.reject(
      this.tenantInvitationsService.parseBigIntId(id, 'id'),
      this.getUserId(req),
    );
  }

  @Get('tenants/:tenantId/invitations')
  @ApiOperation({ summary: 'Listar invitaciones de un tenant' })
  @ApiParam({ name: 'tenantId', description: 'id_tenant del tenant destino' })
  @ApiOkResponse({ type: TenantInvitationResponseDto, isArray: true })
  listByTenant(
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ): Promise<TenantInvitationResponseDto[]> {
    return this.tenantInvitationsService.listByTenant(
      this.tenantInvitationsService.parseBigIntId(tenantId, 'tenantId'),
      this.getUserId(req),
    );
  }

  private getUserId(req: Request): bigint {
    const user = req.user as { userId?: number } | undefined;
    if (!user?.userId || !Number.isInteger(user.userId) || user.userId <= 0) {
      throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
    }
    return BigInt(user.userId);
  }
}
