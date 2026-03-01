import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const TIPOS = ['INGRESO', 'GASTO'];
const CATEGORIAS = [
  'APORTE',
  'MULTA_FAENA',
  'MULTA_ASAMBLEA',
  'APORTE_VOLUNTARIO',
  'DONACION',
  'SALDO_INICIAL_JUNTA_ANTERIOR',
  'OTRO_INGRESO',
  'GASTO_OPERATIVO',
  'MATERIAL_OBRA',
  'MOVILIDAD',
  'REUNION',
  'SERVICIOS',
  'COMPRA_BIEN',
  'OTRO_GASTO',
];
const MEDIOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'OTRO'];

export class QueryCajaMovimientosDto {
  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: TIPOS })
  @IsOptional()
  @IsIn(TIPOS)
  tipo?: string;

  @ApiPropertyOptional({ enum: CATEGORIAS })
  @IsOptional()
  @IsIn(CATEGORIAS)
  categoria?: string;

  @ApiPropertyOptional({ enum: MEDIOS_PAGO })
  @IsOptional()
  @IsIn(MEDIOS_PAGO)
  medioPago?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  anulado?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUser?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
