import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { CreatePersonaDto } from './create-persona.dto';

export class UpdatePersonaDto extends PartialType(CreatePersonaDto) {
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 25,
    description: 'Numero de padron. Solo aplica cuando tipoParticipante es PADRONADO.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nroPadron?: number | null;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'SUSPENDIDO', 'RETIRADO', 'FALLECIDO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'SUSPENDIDO', 'RETIRADO', 'FALLECIDO'])
  estado?: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO' | 'FALLECIDO';

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2026-03-13',
    description: 'Fecha ISO en formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  fechaBaja?: string | null;
}
