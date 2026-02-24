import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAuthUsersDto {
  @ApiPropertyOptional({ example: 'correo.com' })
  email?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] })
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  take?: number;
}
