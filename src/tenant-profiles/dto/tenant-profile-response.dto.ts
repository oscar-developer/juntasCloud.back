import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
