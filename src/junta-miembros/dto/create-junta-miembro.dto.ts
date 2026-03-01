import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

const CARGOS = ['PRESIDENTE', 'VICEPRESIDENTE', 'SECRETARIO', 'TESORERO', 'VOCAL', 'OTRO'];

export class CreateJuntaMiembroDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idJunta!: number;

  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiProperty({ enum: CARGOS })
  @IsIn(CARGOS)
  cargo!: (typeof CARGOS)[number];

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fechaInicio!: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;
}
