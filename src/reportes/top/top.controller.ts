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
import { QueryTopDeudoresDto } from './dto/query-top-deudores.dto';
import { TopService } from './top.service';

@ApiTags('reportes')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('reportes')
export class TopController {
  constructor(private readonly service: TopService) {}

  @Get('top-deudores')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener top deudores del tenant activo' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'object', additionalProperties: true } } })
  getTopDeudores(@Query() query: QueryTopDeudoresDto, @Req() req: Request): Promise<unknown> {
    return this.service.getTopDeudores(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      query.limite ?? 10,
    );
  }
}
