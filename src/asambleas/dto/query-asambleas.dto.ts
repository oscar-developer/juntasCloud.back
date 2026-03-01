import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryAsambleasDto {
  @ApiPropertyOptional({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  @IsOptional()
  @IsIn(['ORDINARIA', 'EXTRAORDINARIA'])
  tipo?: 'ORDINARIA' | 'EXTRAORDINARIA';
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  to?: string;
}
