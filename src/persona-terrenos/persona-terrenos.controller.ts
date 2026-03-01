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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
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
import { CreatePersonaTerrenoDto } from './dto/create-persona-terreno.dto';
import { PersonaTerrenoResponseDto } from './dto/persona-terreno-response.dto';
import { QueryPersonaTerrenosDto } from './dto/query-persona-terrenos.dto';
import { UpdatePersonaTerrenoDto } from './dto/update-persona-terreno.dto';
import { PersonaTerrenosService } from './persona-terrenos.service';

@ApiTags('persona-terrenos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('persona-terrenos')
export class PersonaTerrenosController {
  constructor(private readonly personaTerrenosService: PersonaTerrenosService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear relacion persona-terreno' })
  @ApiCreatedResponse({ type: PersonaTerrenoResponseDto })
  create(
    @Body() dto: CreatePersonaTerrenoDto,
    @Req() req: Request,
  ): Promise<PersonaTerrenoResponseDto> {
    return this.personaTerrenosService.create(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      dto,
    );
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar relaciones persona-terreno' })
  @ApiOkResponse({ type: PersonaTerrenoResponseDto, isArray: true })
  findAll(
    @Query() query: QueryPersonaTerrenosDto,
    @Req() req: Request,
  ): Promise<PersonaTerrenoResponseDto[]> {
    return this.personaTerrenosService.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      query,
    );
  }

  @Get(':idPersonaTerreno')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener relacion persona-terreno por id' })
  @ApiParam({ name: 'idPersonaTerreno' })
  @ApiOkResponse({ type: PersonaTerrenoResponseDto })
  findOne(
    @Param('idPersonaTerreno') idPersonaTerreno: string,
    @Req() req: Request,
  ): Promise<PersonaTerrenoResponseDto> {
    return this.personaTerrenosService.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.personaTerrenosService.parseId(idPersonaTerreno),
    );
  }

  @Patch(':idPersonaTerreno')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar relacion persona-terreno' })
  @ApiParam({ name: 'idPersonaTerreno' })
  @ApiOkResponse({ type: PersonaTerrenoResponseDto })
  update(
    @Param('idPersonaTerreno') idPersonaTerreno: string,
    @Body() dto: UpdatePersonaTerrenoDto,
    @Req() req: Request,
  ): Promise<PersonaTerrenoResponseDto> {
    return this.personaTerrenosService.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.personaTerrenosService.parseId(idPersonaTerreno),
      dto,
    );
  }

  @Delete(':idPersonaTerreno')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar relacion persona-terreno' })
  @ApiParam({ name: 'idPersonaTerreno' })
  @ApiNoContentResponse()
  async remove(@Param('idPersonaTerreno') idPersonaTerreno: string, @Req() req: Request): Promise<void> {
    await this.personaTerrenosService.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.personaTerrenosService.parseId(idPersonaTerreno),
    );
  }
}
