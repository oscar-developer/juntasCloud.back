import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryAsambleasDto {
  @ApiPropertyOptional({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  @IsOptional()
  @IsIn(['ORDINARIA', 'EXTRAORDINARIA'])
  tipo?: 'ORDINARIA' | 'EXTRAORDINARIA';
  @ApiPropertyOptional({ enum: ['PRIMERA', 'SEGUNDA'] })
  @IsOptional()
  @IsIn(['PRIMERA', 'SEGUNDA'])
  convocatoria?: 'PRIMERA' | 'SEGUNDA';
  @ApiPropertyOptional({ enum: ['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'CERRADA'] })
  @IsOptional()
  @IsIn(['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'CERRADA'])
  estado?: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA' | 'CERRADA';
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  to?: string;
}
