import { ApiProperty } from '@nestjs/swagger';

export class ObligacionPagoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idObligacionPago!: number;

  @ApiProperty({ example: 1 })
  idObligacion!: number;

  @ApiProperty({ example: 1 })
  idMovimiento!: number;

  @ApiProperty({ type: Number })
  montoAplicado!: number;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: 10 })
  createdByUser!: number;
}
