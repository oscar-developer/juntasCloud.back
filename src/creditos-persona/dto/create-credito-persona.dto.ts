import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const TIPOS = ['FAENA_ADELANTADA', 'BONIFICACION', 'OTRO'] as const;
const ESTADOS = ['DISPONIBLE', 'CONSUMIDO', 'VENCIDO', 'ANULADO'] as const;

export class CreateCreditoPersonaDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipoCredito!: (typeof TIPOS)[number];

  @ApiProperty({ type: Number, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidadOriginal!: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cantidadDisponible!: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  equivalenciaMonto?: number | null;

  @ApiPropertyOptional({ type: String, maxLength: 30, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenciaTipo?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  referenciaId?: number | null;

  @ApiPropertyOptional({ example: '2026-04-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fechaGeneracion?: string;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string | null;

  @ApiPropertyOptional({ enum: ESTADOS, default: 'DISPONIBLE' })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
