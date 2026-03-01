import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryPersonaTerrenosDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTerreno?: number;

  @ApiPropertyOptional({ enum: ['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'] })
  @IsOptional()
  @IsIn(['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'])
  tipoRelacion?: string;
}
