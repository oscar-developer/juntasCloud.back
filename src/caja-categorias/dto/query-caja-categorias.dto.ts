import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const TIPOS = ['INGRESO', 'GASTO'];

export class QueryCajaCategoriasDto {
  @ApiPropertyOptional({ enum: TIPOS })
  @IsOptional()
  @IsIn(TIPOS)
  tipo?: (typeof TIPOS)[number];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 'cuotas' })
  @IsOptional()
  @IsString()
  search?: string;
}
