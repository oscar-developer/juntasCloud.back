import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryJuntasDirectivasDto {
  @ApiPropertyOptional({ enum: ['VIGENTE', 'CESADA'] })
  @IsOptional()
  @IsIn(['VIGENTE', 'CESADA'])
  estado?: 'VIGENTE' | 'CESADA';

  @ApiPropertyOptional({ type: String, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
