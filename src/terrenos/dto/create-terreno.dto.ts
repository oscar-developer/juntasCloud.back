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
