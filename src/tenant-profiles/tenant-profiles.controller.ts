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
  ParseArrayPipe,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { TenantProfileModuleConfigDto } from './dto/replace-tenant-profile-modules.dto';
import { TenantProfileModuleResponseDto } from './dto/tenant-profile-module-response.dto';
import { TenantProfileResponseDto } from './dto/tenant-profile-response.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { UpdateTenantUserProfileDto } from './dto/update-tenant-user-profile.dto';
import { TenantProfilesService } from './tenant-profiles.service';

@ApiTags('tenant-profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller('tenants/:tenantId')
export class TenantProfilesController {
  constructor(private readonly service: TenantProfilesService) {}

  @Get('profiles')
  @ApiOperation({ summary: 'Listar perfiles del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiOkResponse({ type: TenantProfileResponseDto, isArray: true })
  findAll(
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ): Promise<TenantProfileResponseDto[]> {
    return this.service.findAll(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
    );
  }

  @Get('profiles/:id')
  @ApiOperation({ summary: 'Obtener detalle de perfil' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: TenantProfileResponseDto })
  findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<TenantProfileResponseDto> {
    return this.service.findOne(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(id, 'id'),
    );
  }

  @Post('profiles')
  @ApiOperation({ summary: 'Crear perfil del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiCreatedResponse({ type: TenantProfileResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateTenantProfileDto,
    @Req() req: Request,
  ): Promise<TenantProfileResponseDto> {
    return this.service.create(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      dto,
    );
  }

  @Put('profiles/:id')
  @ApiOperation({ summary: 'Actualizar perfil del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: TenantProfileResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTenantProfileDto,
    @Req() req: Request,
  ): Promise<TenantProfileResponseDto> {
    return this.service.update(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(id, 'id'),
      dto,
    );
  }

  @Delete('profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar perfil del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.service.remove(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(id, 'id'),
    );
  }

  @Get('profiles/:profileId/modules')
  @ApiOperation({ summary: 'Listar modulos configurados para un perfil' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiOkResponse({ type: TenantProfileModuleResponseDto, isArray: true })
  findModules(
    @Param('tenantId') tenantId: string,
    @Param('profileId') profileId: string,
    @Req() req: Request,
  ): Promise<TenantProfileModuleResponseDto[]> {
    return this.service.findModules(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(profileId, 'profileId'),
    );
  }

  @Put('profiles/:profileId/modules')
  @ApiOperation({ summary: 'Reemplazar configuracion completa de modulos del perfil' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'profileId', type: Number })
  @ApiBody({ type: TenantProfileModuleConfigDto, isArray: true })
  @ApiOkResponse({ type: TenantProfileModuleResponseDto, isArray: true })
  replaceModules(
    @Param('tenantId') tenantId: string,
    @Param('profileId') profileId: string,
    @Body(new ParseArrayPipe({ items: TenantProfileModuleConfigDto }))
    dto: TenantProfileModuleConfigDto[],
    @Req() req: Request,
  ): Promise<TenantProfileModuleResponseDto[]> {
    return this.service.replaceModules(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(profileId, 'profileId'),
      dto,
    );
  }

  @Patch('users/:userId/profile')
  @ApiOperation({ summary: 'Modificar perfil de un usuario del tenant' })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'userId', type: Number })
  @ApiOkResponse({ type: TenantProfileResponseDto })
  updateUserProfile(
    @Param('tenantId') tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateTenantUserProfileDto,
    @Req() req: Request,
  ): Promise<TenantProfileResponseDto> {
    return this.service.updateUserProfile(
      this.service.parseId(tenantId, 'tenantId'),
      getUserIdFromRequest(req),
      this.service.parseId(targetUserId, 'userId'),
      BigInt(dto.id_profile),
    );
  }
}
