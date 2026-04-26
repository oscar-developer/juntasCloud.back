import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ESTADOS = ['PENDIENTE', 'PARCIAL', 'PAGADA', 'EXONERADA', 'COMPENSADA', 'ANULADA'] as const;

export class CreateObligacionPersonaDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idConceptoCobro!: number;

  @ApiPropertyOptional({ type: String, maxLength: 20, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  periodo?: string | null;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  fechaEmision!: string;

  @ApiPropertyOptional({ example: '2026-04-30', nullable: true })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string | null;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoOriginal!: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoPagado?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoExonerado?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoCompensado?: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldo!: number;

  @ApiPropertyOptional({ enum: ESTADOS, default: 'PENDIENTE' })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @ApiPropertyOptional({ type: Number, minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idFaena?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idAsamblea?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
