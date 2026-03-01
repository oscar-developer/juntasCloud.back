import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryBienesDto {
  @ApiPropertyOptional({ enum: ['BUENO', 'REGULAR', 'MALO', 'DADO_DE_BAJA'] })
  @IsOptional() @IsIn(['BUENO', 'REGULAR', 'MALO', 'DADO_DE_BAJA'])
  estado?: string;
  @ApiPropertyOptional({ type: String })
  @IsOptional() @IsString()
  tipo?: string;
  @ApiPropertyOptional({ type: String })
  @IsOptional() @IsString()
  search?: string;
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;
  @ApiPropertyOptional({ type: Number, default: 20, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number;
}
