import { ApiProperty } from '@nestjs/swagger';

export class CajaMovimientoListDto {
  @ApiProperty({ example: 1 })
  idMovimiento!: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-03-01T00:00:00.000Z' })
  fecha!: Date;

  @ApiProperty({ example: 'INGRESO' })
  tipo!: string;

  @ApiProperty({ type: Number, example: 100.5 })
  monto!: number;

  @ApiProperty({ type: String, nullable: true, required: false, example: 'Aporte comunal' })
  descripcion?: string | null;

  @ApiProperty({ type: String, nullable: true, required: false, example: 'YAPE' })
  medioPago?: string | null;

  @ApiProperty({ example: false })
  anulado!: boolean;
}
