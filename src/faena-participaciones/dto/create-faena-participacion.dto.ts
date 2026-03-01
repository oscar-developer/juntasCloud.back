import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const ESTADOS = ['PENDIENTE', 'ASISTIO', 'TARDE', 'FALTO', 'JUSTIFICADO'];

export class CreateFaenaParticipacionDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiPropertyOptional({ enum: ESTADOS })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @ApiPropertyOptional({ example: '08:30:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaLlegada debe tener formato HH:mm o HH:mm:ss.' })
  horaLlegada?: string | null;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 20, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  cantPersonasExtra?: number;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  multaGenerada?: boolean;

  @ApiPropertyOptional({ type: Number, minimum: 0, example: 10.5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoMulta?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Llego tarde por lluvia' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
