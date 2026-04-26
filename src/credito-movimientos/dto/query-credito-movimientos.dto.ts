import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

const TIPOS = ['GENERACION', 'CONSUMO', 'AJUSTE', 'VENCIMIENTO', 'ANULACION'] as const;

export class QueryCreditoMovimientosDto {
  @ApiPropertyOptional({ enum: TIPOS })
  @IsOptional()
  @IsIn(TIPOS)
  tipoMovimiento?: (typeof TIPOS)[number];

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
