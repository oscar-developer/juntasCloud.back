import { ApiProperty } from '@nestjs/swagger';

export class CajaMovimientoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idMovimiento!: number;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  fecha!: Date;

  @ApiProperty({ example: 'INGRESO' })
  tipo!: string;

  @ApiProperty({ type: Number, example: 100.5 })
  monto!: number;

  @ApiProperty({ example: 'APORTE' })
  categoria!: string;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  idPersona!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  idFaena!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  idAsamblea!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  idBien!: number | null;

  @ApiProperty({ example: 99 })
  idUser!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Descripcion' })
  descripcion!: string | null;

  @ApiProperty({ example: 'YAPE' })
  medioPago!: string;

  @ApiProperty({ type: String, nullable: true, example: 'DOC-01' })
  docReferencia!: string | null;

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
