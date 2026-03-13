import { ApiProperty } from '@nestjs/swagger';

export class AsambleaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;
  @ApiProperty({ example: 3 })
  idAsamblea!: number;
  @ApiProperty({ example: '2026-03-20T18:00:00.000Z' })
  fechaProgramada!: Date;
  @ApiProperty({ type: String, nullable: true, example: '2026-03-20T18:15:00.000Z' })
  horaInicioReal!: Date | null;
  @ApiProperty({ type: String, nullable: true, example: '2026-03-20T20:30:00.000Z' })
  horaFinReal!: Date | null;
  @ApiProperty({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  tipo!: string;
  @ApiProperty({ enum: ['PRIMERA', 'SEGUNDA'], nullable: true })
  convocatoria!: string | null;
  @ApiProperty({ enum: ['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'CERRADA'] })
  estado!: string;
  @ApiProperty({ example: 'Aprobacion de presupuesto' })
  temaPrincipal!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Local comunal' })
  lugar!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: 50 })
  quorumRequerido!: number | null;
  @ApiProperty({ type: Number, nullable: true, example: 42 })
  quorumAlcanzado!: number | null;
  @ApiProperty({ type: String, nullable: true, example: 'ACTA-2026-001' })
  numeroActa!: string | null;
  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
  @ApiProperty({ type: String, nullable: true, example: '2026-03-20T21:00:00.000Z' })
  cerradaAt!: Date | null;
  @ApiProperty({ type: Number, nullable: true, example: 99 })
  cerradaByUser!: number | null;
}
