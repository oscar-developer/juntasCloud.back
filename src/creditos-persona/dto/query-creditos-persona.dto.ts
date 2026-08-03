import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

const TIPOS = ['FAENA_ADELANTADA', 'BONIFICACION', 'OTRO'] as const;
const ESTADOS = ['DISPONIBLE', 'CONSUMIDO', 'VENCIDO', 'ANULADO'] as const;

export class QueryCreditosPersonaDto {
  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona?: number;

  @ApiPropertyOptional({ enum: TIPOS })
  @IsOptional()
  @IsIn(TIPOS)
  tipoCredito?: (typeof TIPOS)[number];

  @ApiPropertyOptional({ enum: ESTADOS })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];
}
