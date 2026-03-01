import { ApiProperty } from '@nestjs/swagger';

export class AsistenciaAsambleaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idAsistencia!: number;

  @ApiProperty({ example: 1 })
  idAsamblea!: number;

  @ApiProperty({ example: 2 })
  idPersona!: number;

  @ApiProperty({ example: 'ASISTIO' })
  estado!: string;

  @ApiProperty({ type: String, nullable: true, example: '1970-01-01T18:30:00.000Z' })
  horaLlegada!: Date | null;

  @ApiProperty({ example: true })
  esPadronadoEnMomento!: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: 99 })
  createdByUser!: number;

  @ApiProperty({ type: String, nullable: true, example: '2026-03-01T12:00:00.000Z' })
  updatedAt!: Date | null;

  @ApiProperty({ type: Number, nullable: true, example: 99 })
  updatedByUser!: number | null;

  @ApiProperty({ example: false })
  anulado!: boolean;

  @ApiProperty({ type: String, nullable: true, example: '2026-03-01T15:00:00.000Z' })
  anuladoAt!: Date | null;

  @ApiProperty({ type: Number, nullable: true, example: 99 })
  anuladoByUser!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Motivo' })
  motivoAnulacion!: string | null;
}
