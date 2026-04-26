import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const TIPOS = [
  'CUOTA_ORDINARIA',
  'CUOTA_EXTRAORDINARIA',
  'MULTA_FAENA',
  'MULTA_ASAMBLEA',
  'APORTE',
  'OTRO',
] as const;

export class QueryConceptosCobroDto {
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

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  requierePeriodo?: boolean;

  @ApiPropertyOptional({ example: 'cuota' })
  @IsOptional()
  @IsString()
  search?: string;
}
