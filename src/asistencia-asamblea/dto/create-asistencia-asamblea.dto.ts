import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const ESTADOS = ['PENDIENTE', 'ASISTIO', 'TARDE', 'FALTO', 'JUSTIFICADO'];

export class CreateAsistenciaAsambleaDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiPropertyOptional({ enum: ESTADOS })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @ApiPropertyOptional({ example: '18:30:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaLlegada debe tener formato HH:mm o HH:mm:ss.' })
  horaLlegada?: string | null;

  @ApiProperty({ type: Boolean })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  esPadronadoEnMomento!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Invitado' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
