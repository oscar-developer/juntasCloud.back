import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

const TIPOS = [
  'CREACION',
  'PAGO',
  'EXONERACION',
  'AJUSTE_POSITIVO',
  'AJUSTE_NEGATIVO',
  'ANULACION',
  'COMPENSACION',
] as const;

export class QueryObligacionMovimientosDto {
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
