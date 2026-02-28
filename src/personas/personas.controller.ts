import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { getTenantIdFromHeader } from '../common/tenant/get-tenant-id-from-header';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { PersonaResponseDto } from './dto/persona-response.dto';
import { QueryPersonasDto } from './dto/query-personas.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PersonasService } from './personas.service';

@ApiTags('personas')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Tenant-Id',
  required: true,
  description: 'Tenant activo',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear persona' })
  @ApiOkResponse({ type: PersonaResponseDto })
  create(@Body() dto: CreatePersonaDto, @Req() req: Request): Promise<PersonaResponseDto> {
    return this.personasService.create(this.getTenantId(req), this.getUserId(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar personas del tenant activo' })
  @ApiOkResponse({ type: PersonaResponseDto, isArray: true })
  findAll(
    @Query() query: QueryPersonasDto,
    @Req() req: Request,
  ): Promise<PersonaResponseDto[]> {
    return this.personasService.findAll(this.getTenantId(req), this.getUserId(req), query);
  }

  @Get(':idPersona')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener persona por idPersona' })
  @ApiParam({ name: 'idPersona', description: 'id_persona dentro del tenant activo' })
  @ApiOkResponse({ type: PersonaResponseDto })
  findOne(@Param('idPersona') idPersona: string, @Req() req: Request): Promise<PersonaResponseDto> {
    return this.personasService.findOne(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  @Patch(':idPersona')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar persona' })
  @ApiParam({ name: 'idPersona', description: 'id_persona dentro del tenant activo' })
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
  @ApiOperation({ summary: 'Retirar persona (borrado logico)' })
  @ApiParam({ name: 'idPersona', description: 'id_persona dentro del tenant activo' })
  @ApiOkResponse({ type: PersonaResponseDto })
  remove(@Param('idPersona') idPersona: string, @Req() req: Request): Promise<PersonaResponseDto> {
    return this.personasService.remove(
      this.getTenantId(req),
      this.getUserId(req),
      this.personasService.parsePersonaId(idPersona),
    );
  }

  private getUserId(req: Request): bigint {
    const user = req.user as { userId?: number } | undefined;
    if (!user?.userId || !Number.isInteger(user.userId) || user.userId <= 0) {
      throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
    }
    return BigInt(user.userId);
  }

  private getTenantId(req: Request): bigint {
    return getTenantIdFromHeader(req);
  }
}
