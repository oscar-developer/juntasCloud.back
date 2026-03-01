import { ApiProperty } from '@nestjs/swagger';

export class PersonaTerrenoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 4 })
  idPersonaTerreno!: number;

  @ApiProperty({ example: 2 })
  idPersona!: number;

  @ApiProperty({ example: 8 })
  idTerreno!: number;

  @ApiProperty({ enum: ['PROPIETARIO', 'POSEEDOR', 'COPROPIETARIO', 'FAMILIAR', 'OTRO'] })
  tipoRelacion!: string;

  @ApiProperty({ type: Number, nullable: true, example: 50 })
  porcentajeParticipacion!: number | null;
}
