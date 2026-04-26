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
import { CreateObligacionMovimientoDto } from './dto/create-obligacion-movimiento.dto';
import { ObligacionMovimientoResponseDto } from './dto/obligacion-movimiento-response.dto';
import { QueryObligacionMovimientosDto } from './dto/query-obligacion-movimientos.dto';
import { ObligacionMovimientosService } from './obligacion-movimientos.service';

@ApiTags('obligacion-movimientos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller()
export class ObligacionMovimientosController {
  constructor(private readonly service: ObligacionMovimientosService) {}

  @Post('obligaciones-persona/:idObligacion/movimientos')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear movimiento de obligación' })
  @ApiParam({ name: 'idObligacion' })
  @ApiCreatedResponse({ type: ObligacionMovimientoResponseDto })
  create(
    @Param('idObligacion') idObligacion: string,
    @Body() dto: CreateObligacionMovimientoDto,
    @Req() req: Request,
  ): Promise<ObligacionMovimientoResponseDto> {
    return this.service.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion, 'idObligacion'),
      dto,
    );
  }

  @Get('obligaciones-persona/:idObligacion/movimientos')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar movimientos de una obligación' })
  @ApiParam({ name: 'idObligacion' })
  @ApiOkResponse({ type: ObligacionMovimientoResponseDto, isArray: true })
  findAll(
    @Param('idObligacion') idObligacion: string,
    @Query() query: QueryObligacionMovimientosDto,
    @Req() req: Request,
  ): Promise<ObligacionMovimientoResponseDto[]> {
    return this.service.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion, 'idObligacion'),
      query,
    );
  }

  @Get('obligacion-movimientos/:idObligacionMovimiento')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener movimiento de obligación por id' })
  @ApiParam({ name: 'idObligacionMovimiento' })
  @ApiOkResponse({ type: ObligacionMovimientoResponseDto })
  findOne(
    @Param('idObligacionMovimiento') idObligacionMovimiento: string,
    @Req() req: Request,
  ): Promise<ObligacionMovimientoResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacionMovimiento, 'idObligacionMovimiento'),
    );
  }
}
