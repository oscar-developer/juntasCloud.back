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

const TIPOS = ['GENERACION', 'CONSUMO', 'AJUSTE', 'VENCIMIENTO', 'ANULACION'] as const;

export class CreateCreditoMovimientoDto {
  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipoMovimiento!: (typeof TIPOS)[number];

  @ApiProperty({ type: Number, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @ApiPropertyOptional({ example: '2026-04-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fechaMovimiento?: string;

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

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
