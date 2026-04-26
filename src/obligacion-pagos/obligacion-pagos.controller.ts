import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { CreateObligacionPagoDto } from './dto/create-obligacion-pago.dto';
import { ObligacionPagoResponseDto } from './dto/obligacion-pago-response.dto';
import { ObligacionPagosService } from './obligacion-pagos.service';

@ApiTags('obligacion-pagos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller()
export class ObligacionPagosController {
  constructor(private readonly service: ObligacionPagosService) {}

  @Post('obligaciones-persona/:idObligacion/pagos')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear pago aplicado a obligación' })
  @ApiParam({ name: 'idObligacion' })
  @ApiCreatedResponse({ type: ObligacionPagoResponseDto })
  create(
    @Param('idObligacion') idObligacion: string,
    @Body() dto: CreateObligacionPagoDto,
    @Req() req: Request,
  ): Promise<ObligacionPagoResponseDto> {
    return this.service.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion, 'idObligacion'),
      dto,
    );
  }

  @Get('obligaciones-persona/:idObligacion/pagos')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar pagos de una obligación' })
  @ApiParam({ name: 'idObligacion' })
  @ApiOkResponse({ type: ObligacionPagoResponseDto, isArray: true })
  findAll(
    @Param('idObligacion') idObligacion: string,
    @Req() req: Request,
  ): Promise<ObligacionPagoResponseDto[]> {
    return this.service.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion, 'idObligacion'),
    );
  }

  @Get('obligacion-pagos/:idObligacionPago')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener pago de obligación por id' })
  @ApiParam({ name: 'idObligacionPago' })
  @ApiOkResponse({ type: ObligacionPagoResponseDto })
  findOne(
    @Param('idObligacionPago') idObligacionPago: string,
    @Req() req: Request,
  ): Promise<ObligacionPagoResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacionPago, 'idObligacionPago'),
    );
  }
}
