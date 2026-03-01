import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class UpdatePersonaTerrenoDto {
  @ApiPropertyOptional({ enum: ['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'] })
  @IsOptional()
  @IsIn(['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'])
  tipoRelacion?: 'PROPIETARIO' | 'POSEEDOR' | 'COPROPIETARIO' | 'FAMILIAR' | 'OTRO';

  @ApiPropertyOptional({ type: Number, nullable: true, example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  porcentajeParticipacion?: number | null;
}
