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
import { CreateJuntaMiembroDto } from './dto/create-junta-miembro.dto';
import { JuntaMiembroResponseDto } from './dto/junta-miembro-response.dto';
import { QueryJuntaMiembrosDto } from './dto/query-junta-miembros.dto';
import { UpdateJuntaMiembroDto } from './dto/update-junta-miembro.dto';
import { JuntaMiembrosService } from './junta-miembros.service';

@ApiTags('junta-miembros')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('junta-miembros')
export class JuntaMiembrosController {
  constructor(private readonly service: JuntaMiembrosService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear miembro de junta' })
  @ApiCreatedResponse({ type: JuntaMiembroResponseDto })
  create(@Body() dto: CreateJuntaMiembroDto, @Req() req: Request): Promise<JuntaMiembroResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar miembros de junta' })
  @ApiOkResponse({ type: JuntaMiembroResponseDto, isArray: true })
  findAll(
    @Query() query: QueryJuntaMiembrosDto,
    @Req() req: Request,
  ): Promise<JuntaMiembroResponseDto[]> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idJuntaMiembro')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener miembro de junta por id' })
  @ApiParam({ name: 'idJuntaMiembro' })
  @ApiOkResponse({ type: JuntaMiembroResponseDto })
  findOne(
    @Param('idJuntaMiembro') idJuntaMiembro: string,
    @Req() req: Request,
  ): Promise<JuntaMiembroResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idJuntaMiembro),
    );
  }

  @Patch(':idJuntaMiembro')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar miembro de junta' })
  @ApiParam({ name: 'idJuntaMiembro' })
  @ApiOkResponse({ type: JuntaMiembroResponseDto })
  update(
    @Param('idJuntaMiembro') idJuntaMiembro: string,
    @Body() dto: UpdateJuntaMiembroDto,
    @Req() req: Request,
  ): Promise<JuntaMiembroResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idJuntaMiembro),
      dto,
    );
  }

  @Delete(':idJuntaMiembro')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar miembro de junta' })
  @ApiParam({ name: 'idJuntaMiembro' })
  @ApiNoContentResponse()
  async remove(@Param('idJuntaMiembro') idJuntaMiembro: string, @Req() req: Request): Promise<void> {
    await this.service.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idJuntaMiembro),
    );
  }
}
