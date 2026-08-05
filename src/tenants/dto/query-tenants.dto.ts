import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryTenantsDto {
  @ApiPropertyOptional({ example: 'alamos' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'])
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
