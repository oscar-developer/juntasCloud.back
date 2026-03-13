import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePersonaTerrenoDto {
  @ApiPropertyOptional({ enum: ['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'] })
  @IsOptional()
  @IsIn(['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'])
  tipoRelacion?: 'PROPIETARIO' | 'POSEEDOR' | 'COPROPIETARIO' | 'FAMILIAR' | 'OTRO';

  @ApiPropertyOptional({ type: Number, nullable: true, example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeParticipacion?: number | null;
}
