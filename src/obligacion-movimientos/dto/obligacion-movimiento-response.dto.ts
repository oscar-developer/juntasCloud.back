import { ApiProperty } from '@nestjs/swagger';

export class ObligacionMovimientoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idObligacionMovimiento!: number;

  @ApiProperty({ example: 1 })
  idObligacion!: number;

  @ApiProperty({ example: 'CREACION' })
  tipoMovimiento!: string;

  @ApiProperty({ type: Number })
  monto!: number;

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
