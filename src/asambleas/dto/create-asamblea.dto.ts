import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAsambleaDto {
  @ApiProperty({ example: '2026-03-20T18:00:00.000Z' })
  @IsDateString()
  fechaProgramada!: string;

  @ApiPropertyOptional({ example: '2026-03-20T18:15:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  horaInicioReal?: string | null;

  @ApiPropertyOptional({ example: '2026-03-20T20:30:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  horaFinReal?: string | null;

  @ApiProperty({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  @IsIn(['ORDINARIA', 'EXTRAORDINARIA'])
  tipo!: 'ORDINARIA' | 'EXTRAORDINARIA';

  @ApiPropertyOptional({ enum: ['PRIMERA', 'SEGUNDA'], nullable: true })
  @IsOptional()
  @IsIn(['PRIMERA', 'SEGUNDA'])
  convocatoria?: 'PRIMERA' | 'SEGUNDA' | null;

  @ApiPropertyOptional({ enum: ['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'CERRADA'] })
  @IsOptional()
  @IsIn(['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'CERRADA'])
  estado?: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA' | 'CERRADA';

  @ApiProperty({ example: 'Aprobacion de presupuesto', maxLength: 200 })
  @IsString() @MinLength(1) @MaxLength(200)
  temaPrincipal!: string;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Local comunal', maxLength: 200 })
  @IsOptional() @IsString() @MaxLength(200)
  lugar?: string | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  quorumRequerido?: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 42 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  quorumAlcanzado?: number | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'ACTA-2026-001', maxLength: 50 })
  @IsOptional() @IsString() @MaxLength(50)
  numeroActa?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional() @IsString()
  observaciones?: string | null;
}
