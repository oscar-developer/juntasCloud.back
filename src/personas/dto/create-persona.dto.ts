import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePersonaDto {
  @ApiProperty({ example: 'Juan', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres!: string;

  @ApiProperty({ example: 'Perez', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidoPaterno!: string;

  @ApiProperty({ example: 'Gomez', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidoMaterno!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '12345678', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  dni?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '999888777', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Frente al parque central',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenciaVivienda?: string | null;

  @ApiPropertyOptional({ enum: ['PADRONADO', 'NO_PADRONADO', 'INVITADO'] })
  @IsOptional()
  @IsIn(['PADRONADO', 'NO_PADRONADO', 'INVITADO'])
  tipoParticipante?: 'PADRONADO' | 'NO_PADRONADO' | 'INVITADO';

  @ApiPropertyOptional({ enum: ['ACTIVO', 'SUSPENDIDO', 'RETIRADO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'SUSPENDIDO', 'RETIRADO'])
  estado?: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO';

  @ApiPropertyOptional({
    type: String,
    example: '2026-02-28',
    description: 'Fecha ISO en formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  fechaRegistro?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
