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
import { CajaCategoriasService } from './caja-categorias.service';
import { CreateCajaCategoriaDto } from './dto/create-caja-categoria.dto';
import { CajaCategoriaResponseDto } from './dto/caja-categoria-response.dto';
import { QueryCajaCategoriasDto } from './dto/query-caja-categorias.dto';
import { UpdateCajaCategoriaDto } from './dto/update-caja-categoria.dto';

@ApiTags('caja-categorias')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('caja-categorias')
export class CajaCategoriasController {
  constructor(private readonly service: CajaCategoriasService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear categoria de caja' })
  @ApiCreatedResponse({ type: CajaCategoriaResponseDto })
  create(@Body() dto: CreateCajaCategoriaDto, @Req() req: Request): Promise<CajaCategoriaResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar categorias de caja' })
  @ApiOkResponse({ type: CajaCategoriaResponseDto, isArray: true })
  findAll(
    @Query() query: QueryCajaCategoriasDto,
    @Req() req: Request,
  ): Promise<CajaCategoriaResponseDto[]> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idCategoriaCaja')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener categoria de caja por id' })
  @ApiParam({ name: 'idCategoriaCaja' })
  @ApiOkResponse({ type: CajaCategoriaResponseDto })
  findOne(
    @Param('idCategoriaCaja') idCategoriaCaja: string,
    @Req() req: Request,
  ): Promise<CajaCategoriaResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCategoriaCaja),
    );
  }

  @Patch(':idCategoriaCaja')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar categoria de caja' })
  @ApiParam({ name: 'idCategoriaCaja' })
  @ApiOkResponse({ type: CajaCategoriaResponseDto })
  update(
    @Param('idCategoriaCaja') idCategoriaCaja: string,
    @Body() dto: UpdateCajaCategoriaDto,
    @Req() req: Request,
  ): Promise<CajaCategoriaResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCategoriaCaja),
      dto,
    );
  }

  @Delete(':idCategoriaCaja')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar categoria de caja' })
  @ApiParam({ name: 'idCategoriaCaja' })
  @ApiNoContentResponse()
  async remove(
    @Param('idCategoriaCaja') idCategoriaCaja: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.service.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idCategoriaCaja),
    );
  }
}
