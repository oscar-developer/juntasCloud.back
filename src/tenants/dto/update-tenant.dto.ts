import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Junta Directiva Los Alamos', maxLength: 150 })
  nombre?: string;

  @ApiPropertyOptional({ type: String, example: '20123456789', maxLength: 15, nullable: true })
  ruc?: string | null;

  @ApiPropertyOptional({ type: String, example: '12345678', maxLength: 8, nullable: true })
  dni?: string | null;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] })
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({ example: 'Observacion de actualizacion', maxLength: 300, nullable: true })
  observaciones?: string | null;
}
