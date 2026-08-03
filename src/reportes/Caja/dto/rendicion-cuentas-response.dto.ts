import { ApiProperty } from '@nestjs/swagger';

export class RendicionCuentasPeriodoDto {
  @ApiProperty({ example: '2026-01-01' })
  fechaInicio!: string | null;

  @ApiProperty({ example: '2026-12-31' })
  fechaFin!: string | null;
}

export class RendicionCuentasResumenDto {
  @ApiProperty({ example: 1000 })
  saldoInicial!: number;

  @ApiProperty({ example: 5000 })
  totalIngresos!: number;

  @ApiProperty({ example: 2500 })
  totalGastos!: number;

  @ApiProperty({ example: 3500 })
  saldoFinal!: number;
}

export class RendicionCuentasCategoriaDto {
  @ApiProperty({ example: 'INGRESO' })
  tipo!: string | null;

  @ApiProperty({ example: 'Cuotas' })
  categoria!: string | null;

  @ApiProperty({ example: 1500 })
  total!: number;
}

export class RendicionCuentasDetalleMovimientoDto {
  @ApiProperty({ example: '2026-04-26' })
  fecha!: string | null;

  @ApiProperty({ example: 'INGRESO' })
  tipo!: string | null;

  @ApiProperty({ example: 'Cuotas' })
  categoria!: string | null;

  @ApiProperty({ example: 'Ingreso comunal' })
  descripcion!: string | null;

  @ApiProperty({ example: 500 })
  monto!: number;

  @ApiProperty({ example: 'TRANSFERENCIA' })
  medioPago!: string | null;

  @ApiProperty({ example: 'REC-0001', nullable: true })
  docReferencia!: string | null;
}

export class RendicionCuentasResponseDto {
  @ApiProperty({ type: RendicionCuentasPeriodoDto })
  periodo!: RendicionCuentasPeriodoDto;

  @ApiProperty({ type: RendicionCuentasResumenDto })
  resumen!: RendicionCuentasResumenDto;

  @ApiProperty({ type: RendicionCuentasCategoriaDto, isArray: true })
  porCategoria!: RendicionCuentasCategoriaDto[];

  @ApiProperty({ type: RendicionCuentasDetalleMovimientoDto, isArray: true })
  detalleMovimientos!: RendicionCuentasDetalleMovimientoDto[];
}
