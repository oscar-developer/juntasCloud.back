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
import { AnularCreditoPersonaDto } from './dto/anular-credito-persona.dto';
import { CreateCreditoPersonaDto } from './dto/create-credito-persona.dto';
import { CreditoPersonaResponseDto } from './dto/credito-persona-response.dto';
import { QueryCreditosPersonaDto } from './dto/query-creditos-persona.dto';
import { UpdateCreditoPersonaDto } from './dto/update-credito-persona.dto';
import { CreditosPersonaService } from './creditos-persona.service';

@ApiTags('creditos-persona')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('creditos-persona')
export class CreditosPersonaController {
  constructor(private readonly service: CreditosPersonaService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear crédito de persona' })
  @ApiCreatedResponse({ type: CreditoPersonaResponseDto })
  create(@Body() dto: CreateCreditoPersonaDto, @Req() req: Request): Promise<CreditoPersonaResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar créditos de persona' })
  @ApiOkResponse({ type: CreditoPersonaResponseDto, isArray: true })
  findAll(
    @Query() query: QueryCreditosPersonaDto,
    @Req() req: Request,
  ): Promise<CreditoPersonaResponseDto[]> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idCredito')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener crédito por id' })
  @ApiParam({ name: 'idCredito' })
  @ApiOkResponse({ type: CreditoPersonaResponseDto })
  findOne(
    @Param('idCredito') idCredito: string,
    @Req() req: Request,
  ): Promise<CreditoPersonaResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCredito),
    );
  }

  @Patch(':idCredito')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar crédito de persona' })
  @ApiParam({ name: 'idCredito' })
  @ApiOkResponse({ type: CreditoPersonaResponseDto })
  update(
    @Param('idCredito') idCredito: string,
    @Body() dto: UpdateCreditoPersonaDto,
    @Req() req: Request,
  ): Promise<CreditoPersonaResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCredito),
      dto,
    );
  }

  @Post(':idCredito/anular')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Anular crédito de persona' })
  @ApiParam({ name: 'idCredito' })
  @ApiOkResponse({ type: CreditoPersonaResponseDto })
  anular(
    @Param('idCredito') idCredito: string,
    @Body() dto: AnularCreditoPersonaDto,
    @Req() req: Request,
  ): Promise<CreditoPersonaResponseDto> {
    return this.service.anular(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCredito),
      dto,
    );
  }
}
