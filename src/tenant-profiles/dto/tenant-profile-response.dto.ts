import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantProfileModuleResponseDto } from './tenant-profile-module-response.dto';

export class TenantProfileResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idProfile!: number;

  @ApiProperty({ example: 'Administrador' })
  nombre!: string;

  @ApiPropertyOptional({ example: 'Perfil con acceso administrativo', nullable: true })
  descripcion!: string | null;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiPropertyOptional({ example: null, nullable: true })
  createdAt?: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  updatedAt?: Date | null;

  @ApiPropertyOptional({ example: 3 })
  totalModules?: number;

  @ApiPropertyOptional({ example: 1 })
  totalAccess?: number;

  @ApiPropertyOptional({ example: 1 })
  totalReadOnly?: number;

  @ApiPropertyOptional({ example: 1 })
  totalNoAccess?: number;

  @ApiPropertyOptional({ type: TenantProfileModuleResponseDto, isArray: true })
  modules?: TenantProfileModuleResponseDto[];
}
