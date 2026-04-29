import { ApiProperty } from '@nestjs/swagger';
import { ACCESS_LEVELS } from './replace-tenant-profile-modules.dto';

export class TenantProfileModuleResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idProfile!: number;

  @ApiProperty({ example: 'personas' })
  moduleCode!: string;

  @ApiProperty({ example: 'Personas' })
  nombre!: string;

  @ApiProperty({ example: 'Padron' })
  grupo!: string;

  @ApiProperty({ example: 10 })
  orden!: number;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiProperty({ enum: ACCESS_LEVELS })
  accessLevel!: string;
}
