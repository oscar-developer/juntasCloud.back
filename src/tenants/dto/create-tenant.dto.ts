import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Junta Directiva Los Alamos', maxLength: 150 })
  nombre!: string;

  @ApiPropertyOptional({ type: String, example: '20123456789', maxLength: 15 })
  ruc?: string | null;

  @ApiPropertyOptional({ type: String, example: '12345678', maxLength: 8 })
  dni?: string | null;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({ example: 'Tenant creado desde API', maxLength: 300 })
  observaciones?: string | null;
}
