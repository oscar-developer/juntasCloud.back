import { ApiProperty } from '@nestjs/swagger';

export class JuntaDirectivaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 5 })
  idJunta!: number;

  @ApiProperty({ example: 'Junta 2026' })
  nombre!: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  fechaInicio!: Date;

  @ApiProperty({ type: String, nullable: true, example: '2026-12-31T00:00:00.000Z' })
  fechaFin!: Date | null;

  @ApiProperty({ enum: ['VIGENTE', 'CESADA'] })
  estado!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
