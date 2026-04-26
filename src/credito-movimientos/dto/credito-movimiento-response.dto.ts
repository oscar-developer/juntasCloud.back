import { ApiProperty } from '@nestjs/swagger';

export class CreditoMovimientoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idCreditoMovimiento!: number;

  @ApiProperty({ example: 1 })
  idCredito!: number;

  @ApiProperty({ example: 'GENERACION' })
  tipoMovimiento!: string;

  @ApiProperty({ type: Number })
  cantidad!: number;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  fechaMovimiento!: Date;

  @ApiProperty({ type: String, nullable: true })
  referenciaTipo!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  referenciaId!: number | null;

  @ApiProperty({ type: String, nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: 10 })
  createdByUser!: number;
}
