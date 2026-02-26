import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Junta Directiva Los Alamos', maxLength: 150 })
  nombre!: string;

  @ApiPropertyOptional({ example: '20123456789', maxLength: 15 })
  ruc?: string | null;

  @ApiPropertyOptional({ example: '12345678', maxLength: 8 })
  dni?: string | null;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({ example: 'Tenant creado desde API', maxLength: 300 })
  observaciones?: string | null;

  @ApiPropertyOptional({ example: '1', description: 'id_user de auth_users' })
  ownerUserId?: string | null;
}
