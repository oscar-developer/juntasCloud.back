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

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-02-15' })
  @IsOptional()
  @IsDateString()
  fechaEleccion?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;

  @ApiPropertyOptional({ enum: ['VIGENTE', 'CESADA', 'ANULADA', 'PROYECTADA'] })
  @IsOptional()
  @IsIn(['VIGENTE', 'CESADA', 'ANULADA', 'PROYECTADA'])
  estado?: 'VIGENTE' | 'CESADA' | 'ANULADA' | 'PROYECTADA';

  @ApiPropertyOptional({ type: String, nullable: true, example: 'acta-eleccion-2026.pdf', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentoSustento?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
