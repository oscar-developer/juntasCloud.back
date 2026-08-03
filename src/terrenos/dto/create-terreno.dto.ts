import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTerrenoDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: 'LT-001', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigoLote?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'MZ-A', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  manzana?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '12', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  numeroLote?: string | null;

  @ApiProperty({ example: 'Lote 1 sector norte', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descripcion!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1200.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  areaAproxM2?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1180.25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  areaLegalM2?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'PR-2026-001', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  partidaRegistral?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Sector norte, frente a la avenida', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string | null;

  @ApiPropertyOptional({
    enum: ['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'],
  })
  @IsOptional()
  @IsIn(['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'])
  estado?: 'EN_USO' | 'EN_VENTA' | 'VENDIDO_PARCIAL' | 'VENDIDO_TOTAL' | 'RESERVA';

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones del terreno' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
