import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../common/tenant/get-tenant-id-from-header';
import { TenantMembershipGuard } from '../common/tenant/tenant-membership.guard';
import { CreateJuntaDirectivaDto } from './dto/create-junta-directiva.dto';
import { JuntaDirectivaResponseDto } from './dto/junta-directiva-response.dto';
import { QueryJuntasDirectivasDto } from './dto/query-juntas-directivas.dto';
import { UpdateJuntaDirectivaDto } from './dto/update-junta-directiva.dto';
import { JuntasDirectivasService } from './juntas-directivas.service';

@ApiTags('juntas-directivas')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('juntas-directivas')
export class JuntasDirectivasController {
  constructor(private readonly service: JuntasDirectivasService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear junta directiva' })
  @ApiCreatedResponse({ type: JuntaDirectivaResponseDto })
  create(@Body() dto: CreateJuntaDirectivaDto, @Req() req: Request) {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar juntas directivas' })
  @ApiOkResponse({ type: JuntaDirectivaResponseDto, isArray: true })
  findAll(@Query() query: QueryJuntasDirectivasDto, @Req() req: Request) {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idJunta')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener junta directiva por id' })
  @ApiParam({ name: 'idJunta' })
  @ApiOkResponse({ type: JuntaDirectivaResponseDto })
  findOne(@Param('idJunta') id: string, @Req() req: Request) {
    return this.service.findOne(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id));
  }

  @Patch(':idJunta')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar junta directiva' })
  @ApiParam({ name: 'idJunta' })
  @ApiOkResponse({ type: JuntaDirectivaResponseDto })
  update(@Param('idJunta') id: string, @Body() dto: UpdateJuntaDirectivaDto, @Req() req: Request) {
    return this.service.update(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id), dto);
  }

  @Delete(':idJunta')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar junta directiva' })
  @ApiParam({ name: 'idJunta' })
  @ApiNoContentResponse()
  async remove(@Param('idJunta') id: string, @Req() req: Request) {
    await this.service.remove(getTenantIdFromHeader(req), getUserIdFromRequest(req), this.service.parseId(id));
  }
}
