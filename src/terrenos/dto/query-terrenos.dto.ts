import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryTerrenosDto {
  @ApiPropertyOptional({
    enum: ['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'],
  })
  @IsOptional()
  @IsIn(['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'])
  estado?: string;

  @ApiPropertyOptional({ type: String, example: 'lote norte' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
