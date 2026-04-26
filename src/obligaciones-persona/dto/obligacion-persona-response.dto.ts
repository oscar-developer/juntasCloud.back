import { ApiProperty } from '@nestjs/swagger';

export class ObligacionPersonaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idObligacion!: number;

  @ApiProperty({ example: 1 })
  idPersona!: number;

  @ApiProperty({ example: 1 })
  idConceptoCobro!: number;

  @ApiProperty({ type: String, nullable: true })
  periodo!: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fechaEmision!: Date;

  @ApiProperty({ type: String, nullable: true, example: '2026-04-30T00:00:00.000Z' })
  fechaVencimiento!: Date | null;

  @ApiProperty({ type: Number })
  montoOriginal!: number;

  @ApiProperty({ type: Number })
  montoPagado!: number;

  @ApiProperty({ type: Number })
  montoExonerado!: number;

  @ApiProperty({ type: Number })
  montoCompensado!: number;

  @ApiProperty({ type: Number })
  saldo!: number;

  @ApiProperty({ example: 'PENDIENTE' })
  estado!: string;

  @ApiProperty({ type: Number, nullable: true })
  idFaena!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  idAsamblea!: number | null;

  @ApiProperty({ type: String, nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: 10 })
  createdByUser!: number;

  @ApiProperty({ type: String, nullable: true })
  updatedAt!: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  updatedByUser!: number | null;

  @ApiProperty({ type: String, nullable: true })
  anuladaAt!: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  anuladaByUser!: number | null;

  @ApiProperty({ type: String, nullable: true })
  motivoAnulacion!: string | null;
}
