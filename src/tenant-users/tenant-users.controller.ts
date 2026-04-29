import { Controller, Get, Param, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import {
  QueryTenantUsersDto,
  TENANT_USER_ESTADOS,
  TENANT_USER_ROLES,
} from './dto/query-tenant-users.dto';
import { TenantUserResponseDto } from './dto/tenant-user-response.dto';
import { TenantUsersService } from './tenant-users.service';

@ApiTags('tenant-users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT ausente o invalido.' })
@ApiForbiddenResponse({ description: 'El usuario no pertenece al tenant o no tiene permiso.' })
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('tenants/:tenantId/users')
export class TenantUsersController {
  constructor(private readonly service: TenantUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiQuery({ name: 'estado', required: false, enum: TENANT_USER_ESTADOS })
  @ApiQuery({ name: 'role', required: false, enum: TENANT_USER_ROLES })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: TenantUserResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Parametros de busqueda invalidos.' })
  findAll(
    @Param('tenantId') tenantId: string,
    @Query() query: QueryTenantUsersDto,
    @Req() req: Request,
  ): Promise<TenantUserResponseDto[]> {
    return this.service.findAll(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      query,
    );
  }
}
