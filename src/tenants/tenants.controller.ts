import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tenant' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tenants' })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: ['ACTIVO', 'INACTIVO'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: TenantResponseDto, isArray: true })
  findAll(
    @Query('nombre') nombre?: string,
    @Query('estado') estado?: 'ACTIVO' | 'INACTIVO',
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ): Promise<TenantResponseDto[]> {
    const query: QueryTenantsDto = { nombre, estado, skip, take };
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tenant por id_tenant' })
  @ApiParam({ name: 'id', description: 'id_tenant de tenants' })
  @ApiOkResponse({ type: TenantResponseDto })
  findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(this.tenantsService.parseId(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tenant por id_tenant' })
  @ApiParam({ name: 'id', description: 'id_tenant de tenants' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.update(this.tenantsService.parseId(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar tenant por id_tenant' })
  @ApiParam({ name: 'id', description: 'id_tenant de tenants' })
  @ApiNoContentResponse({ description: 'Tenant eliminado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.tenantsService.remove(this.tenantsService.parseId(id));
  }
}
