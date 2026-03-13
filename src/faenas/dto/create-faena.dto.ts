import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const TIPOS_FAENA = ['ORDINARIA', 'EXTRAORDINARIA', 'RECUPERACION'];
const ESTADOS_FAENA = ['PROGRAMADA', 'EJECUTADA', 'CANCELADA'];

export class CreateFaenaDto {
  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  fechaProgramada!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '08:00:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaInicio debe tener formato HH:mm o HH:mm:ss.' })
  horaInicio?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '12:30:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaFin debe tener formato HH:mm o HH:mm:ss.' })
  horaFin?: string | null;

  @ApiProperty({ example: 'Faena comunal', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descripcion!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Sector norte', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string | null;

  @ApiPropertyOptional({ enum: TIPOS_FAENA })
  @IsOptional()
  @IsIn(TIPOS_FAENA)
  tipoFaena?: (typeof TIPOS_FAENA)[number];

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  esObligatoria?: boolean;

  @ApiPropertyOptional({ enum: ESTADOS_FAENA })
  @IsOptional()
  @IsIn(ESTADOS_FAENA)
  estado?: (typeof ESTADOS_FAENA)[number];

  @ApiPropertyOptional({ type: Number, nullable: true, example: 15, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoMultaBase?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
