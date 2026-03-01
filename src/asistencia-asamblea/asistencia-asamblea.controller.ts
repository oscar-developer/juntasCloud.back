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
import { AnularAsistenciaAsambleaDto } from './dto/anular-asistencia-asamblea.dto';
import { AsistenciaAsambleaResponseDto } from './dto/asistencia-asamblea-response.dto';
import { CreateAsistenciaAsambleaDto } from './dto/create-asistencia-asamblea.dto';
import { QueryAsistenciaAsambleaDto } from './dto/query-asistencia-asamblea.dto';
import { UpdateAsistenciaAsambleaDto } from './dto/update-asistencia-asamblea.dto';
import { AsistenciaAsambleaService } from './asistencia-asamblea.service';

@ApiTags('asistencia-asamblea')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller()
export class AsistenciaAsambleaController {
  constructor(private readonly service: AsistenciaAsambleaService) {}

  @Post('asambleas/:idAsamblea/asistencias')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear asistencia de asamblea' })
  @ApiParam({ name: 'idAsamblea' })
  @ApiCreatedResponse({ type: AsistenciaAsambleaResponseDto })
  create(
    @Param('idAsamblea') idAsamblea: string,
    @Body() dto: CreateAsistenciaAsambleaDto,
    @Req() req: Request,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.service.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idAsamblea, 'idAsamblea'),
      dto,
    );
  }

  @Get('asambleas/:idAsamblea/asistencias')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar asistencias de una asamblea' })
  @ApiParam({ name: 'idAsamblea' })
  @ApiOkResponse({ type: AsistenciaAsambleaResponseDto, isArray: true })
  findAll(
    @Param('idAsamblea') idAsamblea: string,
    @Query() query: QueryAsistenciaAsambleaDto,
    @Req() req: Request,
  ): Promise<AsistenciaAsambleaResponseDto[]> {
    return this.service.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idAsamblea, 'idAsamblea'),
      query,
    );
  }

  @Get('asistencia-asamblea/:idAsistencia')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener asistencia de asamblea por id' })
  @ApiParam({ name: 'idAsistencia' })
  @ApiOkResponse({ type: AsistenciaAsambleaResponseDto })
  findOne(
    @Param('idAsistencia') idAsistencia: string,
    @Req() req: Request,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idAsistencia),
    );
  }

  @Patch('asistencia-asamblea/:idAsistencia')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar asistencia de asamblea' })
  @ApiParam({ name: 'idAsistencia' })
  @ApiOkResponse({ type: AsistenciaAsambleaResponseDto })
  update(
    @Param('idAsistencia') idAsistencia: string,
    @Body() dto: UpdateAsistenciaAsambleaDto,
    @Req() req: Request,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idAsistencia),
      dto,
    );
  }

  @Post('asistencia-asamblea/:idAsistencia/anular')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Anular asistencia de asamblea' })
  @ApiParam({ name: 'idAsistencia' })
  @ApiOkResponse({ type: AsistenciaAsambleaResponseDto })
  anular(
    @Param('idAsistencia') idAsistencia: string,
    @Body() dto: AnularAsistenciaAsambleaDto,
    @Req() req: Request,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.service.anular(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idAsistencia),
      dto,
    );
  }
}
