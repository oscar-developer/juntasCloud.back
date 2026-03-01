import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAsambleaDto {
  @ApiProperty({ example: '2026-03-20T18:00:00.000Z' })
  @IsDateString()
  fecha!: string;
  @ApiProperty({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  @IsIn(['ORDINARIA', 'EXTRAORDINARIA'])
  tipo!: 'ORDINARIA' | 'EXTRAORDINARIA';
  @ApiProperty({ example: 'Aprobacion de presupuesto', maxLength: 200 })
  @IsString() @MinLength(1) @MaxLength(200)
  temaPrincipal!: string;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Local comunal', maxLength: 200 })
  @IsOptional() @IsString() @MaxLength(200)
  lugar?: string | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  quorumRequerido?: number | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional() @IsString()
  observaciones?: string | null;
}
