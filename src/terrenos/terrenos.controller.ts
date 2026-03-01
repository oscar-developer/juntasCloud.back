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
import { CreateTerrenoDto } from './dto/create-terreno.dto';
import { QueryTerrenosDto } from './dto/query-terrenos.dto';
import { TerrenoResponseDto } from './dto/terreno-response.dto';
import { UpdateTerrenoDto } from './dto/update-terreno.dto';
import { TerrenosService } from './terrenos.service';

@ApiTags('terrenos')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('terrenos')
export class TerrenosController {
  constructor(private readonly terrenosService: TerrenosService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear terreno' })
  @ApiCreatedResponse({ type: TerrenoResponseDto })
  create(@Body() dto: CreateTerrenoDto, @Req() req: Request): Promise<TerrenoResponseDto> {
    return this.terrenosService.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar terrenos' })
  @ApiOkResponse({ type: TerrenoResponseDto, isArray: true })
  findAll(
    @Query() query: QueryTerrenosDto,
    @Req() req: Request,
  ): Promise<TerrenoResponseDto[]> {
    return this.terrenosService.findAll(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      query,
    );
  }

  @Get(':idTerreno')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener terreno por id' })
  @ApiParam({ name: 'idTerreno' })
  @ApiOkResponse({ type: TerrenoResponseDto })
  findOne(@Param('idTerreno') idTerreno: string, @Req() req: Request): Promise<TerrenoResponseDto> {
    return this.terrenosService.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.terrenosService.parseId(idTerreno),
    );
  }

  @Patch(':idTerreno')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar terreno' })
  @ApiParam({ name: 'idTerreno' })
  @ApiOkResponse({ type: TerrenoResponseDto })
  update(
    @Param('idTerreno') idTerreno: string,
    @Body() dto: UpdateTerrenoDto,
    @Req() req: Request,
  ): Promise<TerrenoResponseDto> {
    return this.terrenosService.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.terrenosService.parseId(idTerreno),
      dto,
    );
  }

  @Delete(':idTerreno')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar terreno' })
  @ApiParam({ name: 'idTerreno' })
  @ApiNoContentResponse()
  async remove(@Param('idTerreno') idTerreno: string, @Req() req: Request): Promise<void> {
    await this.terrenosService.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.terrenosService.parseId(idTerreno),
    );
  }
}
