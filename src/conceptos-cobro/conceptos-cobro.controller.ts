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
import { ConceptosCobroService } from './conceptos-cobro.service';
import { ConceptoCobroResponseDto } from './dto/concepto-cobro-response.dto';
import { CreateConceptoCobroDto } from './dto/create-concepto-cobro.dto';
import { QueryConceptosCobroDto } from './dto/query-conceptos-cobro.dto';
import { UpdateConceptoCobroDto } from './dto/update-concepto-cobro.dto';

@ApiTags('conceptos-cobro')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('conceptos-cobro')
export class ConceptosCobroController {
  constructor(private readonly service: ConceptosCobroService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear concepto de cobro' })
  @ApiCreatedResponse({ type: ConceptoCobroResponseDto })
  create(@Body() dto: CreateConceptoCobroDto, @Req() req: Request): Promise<ConceptoCobroResponseDto> {
    return this.service.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar conceptos de cobro' })
  @ApiOkResponse({ type: ConceptoCobroResponseDto, isArray: true })
  findAll(
    @Query() query: QueryConceptosCobroDto,
    @Req() req: Request,
  ): Promise<ConceptoCobroResponseDto[]> {
    return this.service.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idConceptoCobro')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener concepto de cobro por id' })
  @ApiParam({ name: 'idConceptoCobro' })
  @ApiOkResponse({ type: ConceptoCobroResponseDto })
  findOne(
    @Param('idConceptoCobro') idConceptoCobro: string,
    @Req() req: Request,
  ): Promise<ConceptoCobroResponseDto> {
    return this.service.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idConceptoCobro),
    );
  }

  @Patch(':idConceptoCobro')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar concepto de cobro' })
  @ApiParam({ name: 'idConceptoCobro' })
  @ApiOkResponse({ type: ConceptoCobroResponseDto })
  update(
    @Param('idConceptoCobro') idConceptoCobro: string,
    @Body() dto: UpdateConceptoCobroDto,
    @Req() req: Request,
  ): Promise<ConceptoCobroResponseDto> {
    return this.service.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idConceptoCobro),
      dto,
    );
  }

  @Delete(':idConceptoCobro')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar concepto de cobro' })
  @ApiParam({ name: 'idConceptoCobro' })
  @ApiNoContentResponse()
  async remove(
    @Param('idConceptoCobro') idConceptoCobro: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.service.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.service.parseId(idConceptoCobro),
    );
  }
}
