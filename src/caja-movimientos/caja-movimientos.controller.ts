import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AnularCajaMovimientoDto } from './dto/anular-caja-movimiento.dto';
import { CajaMovimientoResponseDto } from './dto/caja-movimiento-response.dto';
import { CreateCajaMovimientoDto } from './dto/create-caja-movimiento.dto';
import { PaginatedCajaMovimientosResponseDto } from './dto/paginated-caja-movimientos-response.dto';
import { QueryCajaMovimientosDto } from './dto/query-caja-movimientos.dto';
import { UpdateCajaMovimientoDto } from './dto/update-caja-movimiento.dto';
import { CajaMovimientosService } from './caja-movimientos.service';

@ApiTags('caja-movimientos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('caja-movimientos')
export class CajaMovimientosController {
  constructor(private readonly service: CajaMovimientosService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear movimiento de caja' })
  @ApiCreatedResponse({ type: CajaMovimientoResponseDto })
  create(@Body() dto: CreateCajaMovimientoDto, @Req() req: Request): Promise<CajaMovimientoResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar movimientos de caja' })
  @ApiOkResponse({ description: 'Retorna un arreglo o un envelope paginado.' })
  findAll(
    @Query() query: QueryCajaMovimientosDto,
    @Req() req: Request,
  ): Promise<CajaMovimientoResponseDto[] | PaginatedCajaMovimientosResponseDto> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idMovimiento')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener movimiento de caja por id' })
  @ApiParam({ name: 'idMovimiento' })
  @ApiOkResponse({ type: CajaMovimientoResponseDto })
  findOne(
    @Param('idMovimiento') idMovimiento: string,
    @Req() req: Request,
  ): Promise<CajaMovimientoResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idMovimiento),
    );
  }

  @Patch(':idMovimiento')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar movimiento de caja' })
  @ApiParam({ name: 'idMovimiento' })
  @ApiOkResponse({ type: CajaMovimientoResponseDto })
  update(
    @Param('idMovimiento') idMovimiento: string,
    @Body() dto: UpdateCajaMovimientoDto,
    @Req() req: Request,
  ): Promise<CajaMovimientoResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idMovimiento),
      dto,
    );
  }

  @Post(':idMovimiento/anular')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Anular movimiento de caja' })
  @ApiParam({ name: 'idMovimiento' })
  @ApiOkResponse({ type: CajaMovimientoResponseDto })
  anular(
    @Param('idMovimiento') idMovimiento: string,
    @Body() dto: AnularCajaMovimientoDto,
    @Req() req: Request,
  ): Promise<CajaMovimientoResponseDto> {
    return this.service.anular(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idMovimiento),
      dto,
    );
  }
}
