import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { CreatePersonaDto } from './dto/create-persona.dto';
import {
  QueryPersonaAsistenciasDto,
  QueryPersonaObligacionesDto,
  QueryPersonaPagosDto,
} from './dto/persona-ficha-query.dto';
import {
  PaginatedPersonaAsistenciasResponseDto,
  PaginatedPersonaObligacionesResponseDto,
  PaginatedPersonaPagosResponseDto,
  PersonaFichaResponseDto,
  PersonaTerrenoFichaDto,
} from './dto/persona-ficha-response.dto';
import { PersonaResponseDto } from './dto/persona-response.dto';
import { QueryPersonasDto } from './dto/query-personas.dto';
import { PersonaConstanciaEmitidaDto } from './dto/persona-constancia-response.dto';
import { RevocarPersonaConstanciaDto } from './dto/revocar-persona-constancia.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PersonaFichaService } from './persona-ficha.service';
import { PersonaConstanciasService } from './persona-constancias.service';
import { PersonasService } from './personas.service';

@ApiTags('personas')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Tenant-Id',
  required: true,
  description: 'Tenant activo',
})
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('personas')
export class PersonasController {
  constructor(
    private readonly personasService: PersonasService,
    private readonly personaFichaService: PersonaFichaService,
    private readonly personaConstanciasService: PersonaConstanciasService,
  ) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear persona' })
  @ApiOkResponse({ type: PersonaResponseDto })
  create(
    @Body() dto: CreatePersonaDto,
    @Req() req: Request,
  ): Promise<PersonaResponseDto> {
    return this.personasService.create(
      this.getTenantId(req),
      this.getUserId(req),
      dto,
    );
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar personas del tenant activo' })
  @ApiOkResponse({ type: PersonaResponseDto, isArray: true })
  findAll(
    @Query() query: QueryPersonasDto,
    @Req() req: Request,
  ): Promise<PersonaResponseDto[]> {
    return this.personasService.findAll(
      this.getTenantId(req),
      this.getUserId(req),
      query,
    );
  }

  @Get(':idPersona/ficha')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener resumen de ficha de una persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PersonaFichaResponseDto })
  getFicha(
    @Param('idPersona') idPersona: string,
    @Req() req: Request,
  ): Promise<PersonaFichaResponseDto> {
    return this.personaFichaService.getFicha(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  @Get(':idPersona/asistencias')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener historial de asistencias de una persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PaginatedPersonaAsistenciasResponseDto })
  getAsistencias(
    @Param('idPersona') idPersona: string,
    @Query() query: QueryPersonaAsistenciasDto,
    @Req() req: Request,
  ): Promise<PaginatedPersonaAsistenciasResponseDto> {
    return this.personaFichaService.getAsistencias(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
      query,
    );
  }

  @Get(':idPersona/obligaciones')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener obligaciones financieras de una persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PaginatedPersonaObligacionesResponseDto })
  getObligaciones(
    @Param('idPersona') idPersona: string,
    @Query() query: QueryPersonaObligacionesDto,
    @Req() req: Request,
  ): Promise<PaginatedPersonaObligacionesResponseDto> {
    return this.personaFichaService.getObligaciones(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
      query,
    );
  }

  @Get(':idPersona/pagos')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({
    summary: 'Obtener pagos aplicados a obligaciones de una persona',
  })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PaginatedPersonaPagosResponseDto })
  getPagos(
    @Param('idPersona') idPersona: string,
    @Query() query: QueryPersonaPagosDto,
    @Req() req: Request,
  ): Promise<PaginatedPersonaPagosResponseDto> {
    return this.personaFichaService.getPagos(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
      query,
    );
  }

  @Get(':idPersona/terrenos')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener terrenos relacionados a una persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PersonaTerrenoFichaDto, isArray: true })
  getTerrenos(
    @Param('idPersona') idPersona: string,
    @Req() req: Request,
  ): Promise<PersonaTerrenoFichaDto[]> {
    return this.personaFichaService.getTerrenos(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  @Post(':idPersona/constancias')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Emitir una constancia verificable de persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiCreatedResponse({ type: PersonaConstanciaEmitidaDto })
  @ApiBadRequestResponse({
    description: 'Identificador invalido o no se pudo registrar la constancia.',
  })
  @ApiForbiddenResponse({
    description: 'Solo OWNER o ADMIN pueden emitir constancias.',
  })
  @ApiNotFoundResponse({
    description: 'La persona no existe en el tenant activo.',
  })
  issueConstancia(
    @Param('idPersona') idPersona: string,
    @Req() req: Request,
  ): Promise<PersonaConstanciaEmitidaDto> {
    return this.personaConstanciasService.issue(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  @Patch(':idPersona/constancias/:idConstancia/revocar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Revocar una constancia verificable de persona' })
  @ApiParam({ name: 'idPersona', type: Number })
  @ApiParam({ name: 'idConstancia', type: Number })
  @ApiNoContentResponse({ description: 'Constancia revocada correctamente.' })
  @ApiBadRequestResponse({ description: 'Identificador o motivo invalido.' })
  @ApiForbiddenResponse({
    description: 'Solo OWNER o ADMIN pueden revocar constancias.',
  })
  @ApiNotFoundResponse({
    description: 'La constancia no existe o ya fue revocada.',
  })
  async revokeConstancia(
    @Param('idPersona') idPersona: string,
    @Param('idConstancia') idConstancia: string,
    @Body() dto: RevocarPersonaConstanciaDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.personaConstanciasService.revoke(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
      this.personaConstanciasService.parseId(idConstancia, 'idConstancia'),
      dto.motivo,
    );
  }

  @Get(':idPersona')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener persona por idPersona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PersonaResponseDto })
  findOne(
    @Param('idPersona') idPersona: string,
    @Req() req: Request,
  ): Promise<PersonaResponseDto> {
    return this.personasService.findOne(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  @Patch(':idPersona')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar persona' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PersonaResponseDto })
  update(
    @Param('idPersona') idPersona: string,
    @Body() dto: UpdatePersonaDto,
    @Req() req: Request,
  ): Promise<PersonaResponseDto> {
    return this.personasService.update(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
      dto,
    );
  }

  @Delete(':idPersona')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar persona fisicamente' })
  @ApiParam({
    name: 'idPersona',
    type: Number,
    description: 'id_persona dentro del tenant activo',
  })
  @ApiOkResponse({ type: PersonaResponseDto })
  remove(
    @Param('idPersona') idPersona: string,
    @Req() req: Request,
  ): Promise<PersonaResponseDto> {
    return this.personasService.remove(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  private getUserId(req: Request): bigint {
    return getUserIdFromRequest(req);
  }

  private getTenantId(req: Request): bigint {
    return getTenantIdFromHeader(req);
  }
}
