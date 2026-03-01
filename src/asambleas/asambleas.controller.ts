import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { AsambleasService } from './asambleas.service';
import { AsambleaResponseDto } from './dto/asamblea-response.dto';
import { CreateAsambleaDto } from './dto/create-asamblea.dto';
import { QueryAsambleasDto } from './dto/query-asambleas.dto';
import { UpdateAsambleaDto } from './dto/update-asamblea.dto';

@ApiTags('asambleas')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('asambleas')
export class AsambleasController {
  constructor(private readonly service: AsambleasService) {}
  @Post() @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Crear asamblea' }) @ApiCreatedResponse({ type: AsambleaResponseDto })
  create(@Body() dto: CreateAsambleaDto, @Req() req: Request) { return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto); }
  @Get() @Roles('OWNER', 'ADMIN', 'MEMBER') @ApiOperation({ summary: 'Listar asambleas' }) @ApiOkResponse({ type: AsambleaResponseDto, isArray: true })
  findAll(@Query() query: QueryAsambleasDto, @Req() req: Request) { return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query); }
  @Get(':idAsamblea') @Roles('OWNER', 'ADMIN', 'MEMBER') @ApiOperation({ summary: 'Obtener asamblea por id' }) @ApiParam({ name: 'idAsamblea' }) @ApiOkResponse({ type: AsambleaResponseDto })
  findOne(@Param('idAsamblea') id: string, @Req() req: Request) { return this.service.findOne(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id)); }
  @Patch(':idAsamblea') @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Actualizar asamblea' }) @ApiParam({ name: 'idAsamblea' }) @ApiOkResponse({ type: AsambleaResponseDto })
  update(@Param('idAsamblea') id: string, @Body() dto: UpdateAsambleaDto, @Req() req: Request) { return this.service.update(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id), dto); }
  @Delete(':idAsamblea') @Roles('OWNER', 'ADMIN') @ApiOperation({ summary: 'Eliminar asamblea' }) @ApiParam({ name: 'idAsamblea' }) @ApiNoContentResponse()
  async remove(@Param('idAsamblea') id: string, @Req() req: Request) { await this.service.remove(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id)); }
}
