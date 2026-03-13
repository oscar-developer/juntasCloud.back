import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

const TIPOS_FAENA = ['ORDINARIA', 'EXTRAORDINARIA', 'RECUPERACION'];
const ESTADOS_FAENA = ['PROGRAMADA', 'EJECUTADA', 'CANCELADA'];

export class QueryFaenasDto {
  @ApiPropertyOptional({ type: String, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ type: String, example: 'faena' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TIPOS_FAENA })
  @IsOptional()
  @IsIn(TIPOS_FAENA)
  tipoFaena?: string;

  @ApiPropertyOptional({ enum: ESTADOS_FAENA })
  @IsOptional()
  @IsIn(ESTADOS_FAENA)
  estado?: string;
}
