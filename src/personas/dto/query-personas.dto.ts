import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryPersonasDto {
  @ApiPropertyOptional({ type: String, example: '12345678' })
  @IsOptional()
  @IsString()
  dni?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'SUSPENDIDO', 'RETIRADO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'SUSPENDIDO', 'RETIRADO'])
  estado?: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO';

  @ApiPropertyOptional({ enum: ['PADRONADO', 'NO_PADRONADO', 'INVITADO'] })
  @IsOptional()
  @IsIn(['PADRONADO', 'NO_PADRONADO', 'INVITADO'])
  tipoParticipante?: 'PADRONADO' | 'NO_PADRONADO' | 'INVITADO';

  @ApiPropertyOptional({ type: String, example: 'juan perez' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
