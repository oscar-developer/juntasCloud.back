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
import { AnularObligacionPersonaDto } from './dto/anular-obligacion-persona.dto';
import { CreateObligacionPersonaDto } from './dto/create-obligacion-persona.dto';
import { ObligacionPersonaResponseDto } from './dto/obligacion-persona-response.dto';
import { QueryObligacionesPersonaDto } from './dto/query-obligaciones-persona.dto';
import { UpdateObligacionPersonaDto } from './dto/update-obligacion-persona.dto';
import { ObligacionesPersonaService } from './obligaciones-persona.service';

@ApiTags('obligaciones-persona')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('obligaciones-persona')
export class ObligacionesPersonaController {
  constructor(private readonly service: ObligacionesPersonaService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear obligación de persona' })
  @ApiCreatedResponse({ type: ObligacionPersonaResponseDto })
  create(@Body() dto: CreateObligacionPersonaDto, @Req() req: Request): Promise<ObligacionPersonaResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar obligaciones de persona' })
  @ApiOkResponse({ type: ObligacionPersonaResponseDto, isArray: true })
  findAll(
    @Query() query: QueryObligacionesPersonaDto,
    @Req() req: Request,
  ): Promise<ObligacionPersonaResponseDto[]> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idObligacion')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener obligación por id' })
  @ApiParam({ name: 'idObligacion' })
  @ApiOkResponse({ type: ObligacionPersonaResponseDto })
  findOne(
    @Param('idObligacion') idObligacion: string,
    @Req() req: Request,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion),
    );
  }

  @Patch(':idObligacion')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar obligación de persona' })
  @ApiParam({ name: 'idObligacion' })
  @ApiOkResponse({ type: ObligacionPersonaResponseDto })
  update(
    @Param('idObligacion') idObligacion: string,
    @Body() dto: UpdateObligacionPersonaDto,
    @Req() req: Request,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion),
      dto,
    );
  }

  @Post(':idObligacion/anular')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Anular obligación de persona' })
  @ApiParam({ name: 'idObligacion' })
  @ApiOkResponse({ type: ObligacionPersonaResponseDto })
  anular(
    @Param('idObligacion') idObligacion: string,
    @Body() dto: AnularObligacionPersonaDto,
    @Req() req: Request,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.service.anular(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idObligacion),
      dto,
    );
  }
}
