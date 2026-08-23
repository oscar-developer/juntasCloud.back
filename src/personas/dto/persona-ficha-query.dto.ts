import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const TIPOS_ASISTENCIA = ['FAENA', 'ASAMBLEA'];
const ESTADOS_ASISTENCIA = ['PENDIENTE', 'ASISTIO', 'TARDE', 'FALTO', 'JUSTIFICADO'];
const ESTADOS_OBLIGACION = [
  'PENDIENTE',
  'PARCIAL',
  'PAGADA',
  'EXONERADA',
  'COMPENSADA',
  'ANULADA',
];

export class QueryPersonaAsistenciasDto {
  @ApiPropertyOptional({ enum: TIPOS_ASISTENCIA })
  @IsOptional()
  @IsIn(TIPOS_ASISTENCIA)
  tipo?: string;

  @ApiPropertyOptional({ enum: ESTADOS_ASISTENCIA })
  @IsOptional()
  @IsIn(ESTADOS_ASISTENCIA)
  estado?: string;

  @ApiPropertyOptional({ type: Number, example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class QueryPersonaObligacionesDto {
  @ApiPropertyOptional({ enum: ESTADOS_OBLIGACION })
  @IsOptional()
  @IsIn(ESTADOS_OBLIGACION)
  estado?: string;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class QueryPersonaPagosDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
