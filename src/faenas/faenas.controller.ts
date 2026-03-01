import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CreateFaenaDto } from './dto/create-faena.dto';
import { FaenaResponseDto } from './dto/faena-response.dto';
import { QueryFaenasDto } from './dto/query-faenas.dto';
import { UpdateFaenaDto } from './dto/update-faena.dto';
import { FaenasService } from './faenas.service';

@ApiTags('faenas')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('faenas')
export class FaenasController {
  constructor(private readonly service: FaenasService) {}
  @Post() @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Crear faena' }) @ApiCreatedResponse({ type: FaenaResponseDto })
  create(@Body() dto: CreateFaenaDto, @Req() req: Request) { return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto); }
  @Get() @Roles('OWNER', 'ADMIN', 'MEMBER') @ApiOperation({ summary: 'Listar faenas' }) @ApiOkResponse({ type: FaenaResponseDto, isArray: true })
  findAll(@Query() query: QueryFaenasDto, @Req() req: Request) { return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query); }
  @Get(':idFaena') @Roles('OWNER', 'ADMIN', 'MEMBER') @ApiOperation({ summary: 'Obtener faena por id' }) @ApiParam({ name: 'idFaena' }) @ApiOkResponse({ type: FaenaResponseDto })
  findOne(@Param('idFaena') id: string, @Req() req: Request) { return this.service.findOne(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id)); }
  @Patch(':idFaena') @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Actualizar faena' }) @ApiParam({ name: 'idFaena' }) @ApiOkResponse({ type: FaenaResponseDto })
  update(@Param('idFaena') id: string, @Body() dto: UpdateFaenaDto, @Req() req: Request) { return this.service.update(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id), dto); }
  @Delete(':idFaena') @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Eliminar faena' }) @ApiParam({ name: 'idFaena' }) @ApiNoContentResponse()
  async remove(@Param('idFaena') id: string, @Req() req: Request) { await this.service.remove(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id)); }
}
