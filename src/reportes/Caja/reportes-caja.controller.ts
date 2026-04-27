import {
  Controller,
  Get,
  Query,
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
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../../common/auth/get-user-id-from-request';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../../common/tenant/tenant-membership.guard';
import { QueryRendicionCuentasDto } from './dto/query-rendicion-cuentas.dto';
import { RendicionCuentasResponseDto } from './dto/rendicion-cuentas-response.dto';
import { ReportesCajaService } from './reportes-caja.service';

@ApiTags('reportes')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('reportes')
export class ReportesCajaController {
  constructor(private readonly service: ReportesCajaService) {}

  @Get('rendicion-cuentas')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener reporte de rendicion de cuentas por junta directiva' })
  @ApiOkResponse({ type: RendicionCuentasResponseDto })
  getRendicionCuentas(
    @Query() query: QueryRendicionCuentasDto,
    @Req() req: Request,
  ): Promise<RendicionCuentasResponseDto> {
    return this.service.getRendicionCuentas(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      query,
    );
  }
}
