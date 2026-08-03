import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreatePersonaTerrenoDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona!: number;

  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTerreno!: number;

  @ApiProperty({ enum: ['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'] })
  @IsIn(['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'])
  tipoRelacion!: 'PROPIETARIO' | 'POSEEDOR' | 'COPROPIETARIO' | 'FAMILIAR' | 'OTRO';

  @ApiPropertyOptional({ type: Number, nullable: true, example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeParticipacion?: number | null;
}
