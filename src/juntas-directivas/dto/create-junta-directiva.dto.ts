import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateJuntaDirectivaDto {
  @ApiProperty({ example: 'Junta 2026', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fechaInicio!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;

  @ApiPropertyOptional({ enum: ['VIGENTE', 'CESADA'] })
  @IsOptional()
  @IsIn(['VIGENTE', 'CESADA'])
  estado?: 'VIGENTE' | 'CESADA';

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
