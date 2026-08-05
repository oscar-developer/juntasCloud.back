import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
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
import { ProcessTenantInvitationDto } from './dto/process-tenant-invitation.dto';
import { TenantInvitationResponseDto } from './dto/tenant-invitation-response.dto';
import { TenantInvitationsService } from './tenant-invitations.service';

@ApiTags('tenant-invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class TenantInvitationsController {
  constructor(
    private readonly tenantInvitationsService: TenantInvitationsService,
  ) {}

  @Post('tenants/:tenantId/invitations')
  @ApiOperation({ summary: 'Crear invitacion para un tenant' })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'id_tenant del tenant destino',
  })
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
  @ApiOperation({
    summary:
      'Listar historial de invitaciones recibidas del usuario autenticado',
  })
  @ApiOkResponse({ type: TenantInvitationResponseDto, isArray: true })
  listMine(@Req() req: Request): Promise<TenantInvitationResponseDto[]> {
    return this.tenantInvitationsService.listMine(this.getUserId(req));
  }

  @Get('me/invitations/sent')
  @ApiOperation({
    summary:
      'Listar historial de invitaciones realizadas por el usuario autenticado',
  })
  @ApiOkResponse({ type: TenantInvitationResponseDto, isArray: true })
  listSentMine(@Req() req: Request): Promise<TenantInvitationResponseDto[]> {
    return this.tenantInvitationsService.listSentMine(this.getUserId(req));
  }

  @Post('me/invitations/accept')
  @ApiOperation({ summary: 'Aceptar invitacion' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  accept(
    @Body() dto: ProcessTenantInvitationDto,
    @Req() req: Request,
  ): Promise<TenantInvitationResponseDto> {
    return this.tenantInvitationsService.accept(
      dto.token,
      this.getUserId(req),
    );
  }

  @Post('me/invitations/reject')
  @ApiOperation({ summary: 'Rechazar invitacion' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  reject(
    @Body() dto: ProcessTenantInvitationDto,
    @Req() req: Request,
  ): Promise<TenantInvitationResponseDto> {
    return this.tenantInvitationsService.reject(
      dto.token,
      this.getUserId(req),
    );
  }

  @Get('tenants/:tenantId/invitations')
  @ApiOperation({ summary: 'Listar invitaciones de un tenant' })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'id_tenant del tenant destino',
  })
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
      throw new UnauthorizedException(
        'Token invalido: user_id ausente o invalido.',
      );
    }
    return BigInt(user.userId);
  }
}
