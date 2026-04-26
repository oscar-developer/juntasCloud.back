import { ApiProperty } from '@nestjs/swagger';

export class CreditoPersonaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idCredito!: number;

  @ApiProperty({ example: 1 })
  idPersona!: number;

  @ApiProperty({ example: 'FAENA_ADELANTADA' })
  tipoCredito!: string;

  @ApiProperty({ type: Number })
  cantidadOriginal!: number;

  @ApiProperty({ type: Number })
  cantidadDisponible!: number;

  @ApiProperty({ type: Number, nullable: true })
  equivalenciaMonto!: number | null;

  @ApiProperty({ type: String, nullable: true })
  referenciaTipo!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  referenciaId!: number | null;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  fechaGeneracion!: Date;

  @ApiProperty({ type: String, nullable: true })
  fechaVencimiento!: Date | null;

  @ApiProperty({ example: 'DISPONIBLE' })
  estado!: string;

  @ApiProperty({ type: String, nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: 10 })
  createdByUser!: number;
}
