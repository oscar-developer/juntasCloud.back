import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CreditoMovimientosService } from './credito-movimientos.service';
import { CreateCreditoMovimientoDto } from './dto/create-credito-movimiento.dto';
import { CreditoMovimientoResponseDto } from './dto/credito-movimiento-response.dto';
import { QueryCreditoMovimientosDto } from './dto/query-credito-movimientos.dto';

@ApiTags('credito-movimientos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller()
export class CreditoMovimientosController {
  constructor(private readonly service: CreditoMovimientosService) {}

  @Post('creditos-persona/:idCredito/movimientos')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear movimiento de crédito' })
  @ApiParam({ name: 'idCredito' })
  @ApiCreatedResponse({ type: CreditoMovimientoResponseDto })
  create(
    @Param('idCredito') idCredito: string,
    @Body() dto: CreateCreditoMovimientoDto,
    @Req() req: Request,
  ): Promise<CreditoMovimientoResponseDto> {
    return this.service.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCredito, 'idCredito'),
      dto,
    );
  }

  @Get('creditos-persona/:idCredito/movimientos')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar movimientos de un crédito' })
  @ApiParam({ name: 'idCredito' })
  @ApiOkResponse({ type: CreditoMovimientoResponseDto, isArray: true })
  findAll(
    @Param('idCredito') idCredito: string,
    @Query() query: QueryCreditoMovimientosDto,
    @Req() req: Request,
  ): Promise<CreditoMovimientoResponseDto[]> {
    return this.service.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCredito, 'idCredito'),
      query,
    );
  }

  @Get('credito-movimientos/:idCreditoMovimiento')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener movimiento de crédito por id' })
  @ApiParam({ name: 'idCreditoMovimiento' })
  @ApiOkResponse({ type: CreditoMovimientoResponseDto })
  findOne(
    @Param('idCreditoMovimiento') idCreditoMovimiento: string,
    @Req() req: Request,
  ): Promise<CreditoMovimientoResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCreditoMovimiento, 'idCreditoMovimiento'),
    );
  }
}
