import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryJuntasDirectivasDto {
  @ApiPropertyOptional({ enum: ['VIGENTE', 'CESADA', 'ANULADA', 'PROYECTADA'] })
  @IsOptional()
  @IsIn(['VIGENTE', 'CESADA', 'ANULADA', 'PROYECTADA'])
  estado?: 'VIGENTE' | 'CESADA' | 'ANULADA' | 'PROYECTADA';

  @ApiPropertyOptional({ type: String, example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
