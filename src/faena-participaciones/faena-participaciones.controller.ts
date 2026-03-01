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
import { AnularFaenaParticipacionDto } from './dto/anular-faena-participacion.dto';
import { CreateFaenaParticipacionDto } from './dto/create-faena-participacion.dto';
import { FaenaParticipacionResponseDto } from './dto/faena-participacion-response.dto';
import { QueryFaenaParticipacionesDto } from './dto/query-faena-participaciones.dto';
import { UpdateFaenaParticipacionDto } from './dto/update-faena-participacion.dto';
import { FaenaParticipacionesService } from './faena-participaciones.service';

@ApiTags('faena-participaciones')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller()
export class FaenaParticipacionesController {
  constructor(private readonly service: FaenaParticipacionesService) {}

  @Post('faenas/:idFaena/participaciones')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear participacion en faena' })
  @ApiParam({ name: 'idFaena' })
  @ApiCreatedResponse({ type: FaenaParticipacionResponseDto })
  create(
    @Param('idFaena') idFaena: string,
    @Body() dto: CreateFaenaParticipacionDto,
    @Req() req: Request,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.service.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idFaena, 'idFaena'),
      dto,
    );
  }

  @Get('faenas/:idFaena/participaciones')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar participaciones de una faena' })
  @ApiParam({ name: 'idFaena' })
  @ApiOkResponse({ type: FaenaParticipacionResponseDto, isArray: true })
  findAll(
    @Param('idFaena') idFaena: string,
    @Query() query: QueryFaenaParticipacionesDto,
    @Req() req: Request,
  ): Promise<FaenaParticipacionResponseDto[]> {
    return this.service.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idFaena, 'idFaena'),
      query,
    );
  }

  @Get('faena-participaciones/:idFaenaParticipacion')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener participacion de faena por id' })
  @ApiParam({ name: 'idFaenaParticipacion' })
  @ApiOkResponse({ type: FaenaParticipacionResponseDto })
  findOne(
    @Param('idFaenaParticipacion') idFaenaParticipacion: string,
    @Req() req: Request,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idFaenaParticipacion),
    );
  }

  @Patch('faena-participaciones/:idFaenaParticipacion')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar participacion de faena' })
  @ApiParam({ name: 'idFaenaParticipacion' })
  @ApiOkResponse({ type: FaenaParticipacionResponseDto })
  update(
    @Param('idFaenaParticipacion') idFaenaParticipacion: string,
    @Body() dto: UpdateFaenaParticipacionDto,
    @Req() req: Request,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idFaenaParticipacion),
      dto,
    );
  }

  @Post('faena-participaciones/:idFaenaParticipacion/anular')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Anular participacion de faena' })
  @ApiParam({ name: 'idFaenaParticipacion' })
  @ApiOkResponse({ type: FaenaParticipacionResponseDto })
  anular(
    @Param('idFaenaParticipacion') idFaenaParticipacion: string,
    @Body() dto: AnularFaenaParticipacionDto,
    @Req() req: Request,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.service.anular(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idFaenaParticipacion),
      dto,
    );
  }
}
