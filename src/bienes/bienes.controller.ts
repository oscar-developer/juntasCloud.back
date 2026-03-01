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
import { BienesService } from './bienes.service';
import { BienResponseDto } from './dto/bien-response.dto';
import { CreateBienDto } from './dto/create-bien.dto';
import { QueryBienesDto } from './dto/query-bienes.dto';
import { UpdateBienDto } from './dto/update-bien.dto';

@ApiTags('bienes')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant activo' })
@UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('bienes')
export class BienesController {
  constructor(private readonly bienesService: BienesService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear bien' })
  @ApiCreatedResponse({ type: BienResponseDto })
  create(@Body() dto: CreateBienDto, @Req() req: Request): Promise<BienResponseDto> {
    return this.bienesService.create(getTenantIdFromHeader(req), getUserIdFromRequest(req), dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Listar bienes' })
  @ApiOkResponse({ type: BienResponseDto, isArray: true })
  findAll(@Query() query: QueryBienesDto, @Req() req: Request): Promise<BienResponseDto[]> {
    return this.bienesService.findAll(getTenantIdFromHeader(req), getUserIdFromRequest(req), query);
  }

  @Get(':idBien')
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Obtener bien por id' })
  @ApiParam({ name: 'idBien' })
  @ApiOkResponse({ type: BienResponseDto })
  findOne(@Param('idBien') idBien: string, @Req() req: Request): Promise<BienResponseDto> {
    return this.bienesService.findOne(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.bienesService.parseId(idBien),
    );
  }

  @Patch(':idBien')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar bien' })
  @ApiParam({ name: 'idBien' })
  @ApiOkResponse({ type: BienResponseDto })
  update(
    @Param('idBien') idBien: string,
    @Body() dto: UpdateBienDto,
    @Req() req: Request,
  ): Promise<BienResponseDto> {
    return this.bienesService.update(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.bienesService.parseId(idBien),
      dto,
    );
  }

  @Delete(':idBien')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Dar de baja bien' })
  @ApiParam({ name: 'idBien' })
  @ApiOkResponse({ type: BienResponseDto })
  remove(@Param('idBien') idBien: string, @Req() req: Request): Promise<BienResponseDto> {
    return this.bienesService.remove(
      getTenantIdFromHeader(req),
      getUserIdFromRequest(req),
      this.bienesService.parseId(idBien),
    );
  }
}
