import { ApiProperty } from '@nestjs/swagger';

export class PersonaFichaPersonaDto {
  @ApiProperty({ example: 1 })
  idPersona!: number;

  @ApiProperty({ type: Number, nullable: true, example: 25 })
  nroPadron!: number | null;

  @ApiProperty({ example: 'Juan' })
  nombres!: string;

  @ApiProperty({ example: 'Juan Perez Gomez' })
  nombreCompleto!: string;

  @ApiProperty({ type: String, nullable: true, example: '12345678' })
  dni!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '999888777' })
  telefono!: string | null;

  @ApiProperty({ example: 'ACTIVO' })
  estado!: string;
}

export class PersonaFichaFinancieroDto {
  @ApiProperty({ type: Number, example: 125.5 })
  deudaPendienteTotal!: number;
}

export class PersonaFichaResumenAsistenciaDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 7 })
  asistencias!: number;

  @ApiProperty({ example: 2 })
  faltas!: number;

  @ApiProperty({ example: 1 })
  tardanzas!: number;

  @ApiProperty({ type: Number, example: 80 })
  porcentajeAsistencia!: number;
}

export class PersonaFichaEventoDto {
  @ApiProperty({ enum: ['FAENA', 'ASAMBLEA'] })
  tipo!: string;

  @ApiProperty({ example: 1 })
  idEvento!: number;

  @ApiProperty({ example: 1 })
  idAsistencia!: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fecha!: Date | string;

  @ApiProperty({ example: 'Limpieza sector B' })
  nombreEvento!: string;

  @ApiProperty({ example: 'FALTO' })
  estadoAsistencia!: string;

  @ApiProperty({ type: String, nullable: true, example: '08:15:00' })
  horaLlegada!: string | null;

  @ApiProperty({ example: true })
  generoObligacion!: boolean;

  @ApiProperty({ example: true })
  multaGenerada!: boolean;

  @ApiProperty({ type: Number, nullable: true, example: 20 })
  montoRelacionado!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 5 })
  idObligacion!: number | null;

  @ApiProperty({ example: false })
  relacionObligacionAmbigua!: boolean;
}

export class PersonaFichaResponseDto {
  @ApiProperty({ type: PersonaFichaPersonaDto })
  persona!: PersonaFichaPersonaDto;

  @ApiProperty({ type: PersonaFichaFinancieroDto })
  resumenFinanciero!: PersonaFichaFinancieroDto;

  @ApiProperty({ type: PersonaFichaResumenAsistenciaDto })
  resumenFaenas!: PersonaFichaResumenAsistenciaDto;

  @ApiProperty({ type: PersonaFichaResumenAsistenciaDto })
  resumenAsambleas!: PersonaFichaResumenAsistenciaDto;

  @ApiProperty({ type: PersonaFichaEventoDto, isArray: true })
  ultimosEventos!: PersonaFichaEventoDto[];
}

export class PersonaAsistenciaFichaDto {
  @ApiProperty({ enum: ['FAENA', 'ASAMBLEA'] })
  tipoEvento!: string;

  @ApiProperty({ example: 1 })
  idEvento!: number;

  @ApiProperty({ example: 1 })
  idAsistencia!: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fecha!: Date | string;

  @ApiProperty({ example: 'Limpieza sector B' })
  nombreEvento!: string;

  @ApiProperty({ example: 'FALTO' })
  estado!: string;

  @ApiProperty({ type: String, nullable: true })
  horaLlegada!: string | null;

  @ApiProperty({ type: String, nullable: true })
  observacion!: string | null;

  @ApiProperty({ example: true })
  multaGenerada!: boolean;

  @ApiProperty({ type: Number, nullable: true })
  montoMulta!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  idObligacion!: number | null;

  @ApiProperty({ type: String, nullable: true })
  estadoObligacion!: string | null;

  @ApiProperty({ example: false })
  relacionObligacionAmbigua!: boolean;
}

export class PersonaObligacionEventoDto {
  @ApiProperty({ enum: ['FAENA', 'ASAMBLEA'] })
  tipoEvento!: string;

  @ApiProperty({ example: 1 })
  idEvento!: number;

  @ApiProperty({ example: 'Limpieza sector B' })
  nombreEvento!: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fecha!: Date | string;

  @ApiProperty({ type: Number, nullable: true })
  idAsistencia!: number | null;
}

export class PersonaObligacionFichaDto {
  @ApiProperty({ example: 1 })
  idObligacion!: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fecha!: Date | string;

  @ApiProperty({ example: 'Multa por faena' })
  concepto!: string;

  @ApiProperty({ type: String, nullable: true })
  descripcion!: string | null;

  @ApiProperty({ type: Number })
  importeOriginal!: number;

  @ApiProperty({ type: Number })
  saldoPendiente!: number;

  @ApiProperty({ example: 'PENDIENTE' })
  estado!: string;

  @ApiProperty({ example: 'MULTA_FAENA' })
  origen!: string;

  @ApiProperty({ enum: ['FAENA', 'ASAMBLEA'], nullable: true })
  tipoEvento!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  idEvento!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  idAsistencia!: number | null;

  @ApiProperty({ type: String, nullable: true })
  fechaVencimiento!: Date | string | null;

  @ApiProperty({ type: PersonaObligacionEventoDto, nullable: true })
  eventoRelacionado!: PersonaObligacionEventoDto | null;
}

export class PersonaPagoFichaDto {
  @ApiProperty({ example: 1 })
  idObligacionPago!: number;

  @ApiProperty({ example: 1 })
  idObligacion!: number;

  @ApiProperty({ example: 1 })
  idMovimiento!: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  fecha!: Date | string;

  @ApiProperty({ type: Number })
  importe!: number;

  @ApiProperty({ example: 'Cuota ordinaria' })
  concepto!: string;

  @ApiProperty({ example: 'EFECTIVO' })
  medioPago!: string;

  @ApiProperty({ type: String, nullable: true })
  referencia!: string | null;

  @ApiProperty({ type: String, nullable: true })
  descripcion!: string | null;

  @ApiProperty({ example: 'REGISTRADO' })
  estado!: string;

  @ApiProperty({ example: false })
  anulado!: boolean;

  @ApiProperty({ enum: ['FAENA', 'ASAMBLEA'], nullable: true })
  tipoEvento!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  idEvento!: number | null;
}

export class PersonaTerrenoFichaDto {
  @ApiProperty({ example: 1 })
  idPersonaTerreno!: number;

  @ApiProperty({ example: 1 })
  idTerreno!: number;

  @ApiProperty({ type: String, nullable: true })
  codigoLote!: string | null;

  @ApiProperty({ type: String, nullable: true })
  manzana!: string | null;

  @ApiProperty({ type: String, nullable: true })
  numeroLote!: string | null;

  @ApiProperty({ example: 'Lote sector B' })
  descripcion!: string;

  @ApiProperty({ type: Number, nullable: true })
  areaAproxM2!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  areaLegalM2!: number | null;

  @ApiProperty({ type: String, nullable: true })
  partidaRegistral!: string | null;

  @ApiProperty({ type: String, nullable: true })
  ubicacion!: string | null;

  @ApiProperty({ example: 'EN_USO' })
  estado!: string;

  @ApiProperty({ example: 'PROPIETARIO' })
  tipoRelacion!: string;

  @ApiProperty({ type: Number, nullable: true })
  porcentajeParticipacion!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  relacionPrincipal!: boolean | null;
}

export class PaginatedPersonaAsistenciasResponseDto {
  @ApiProperty({ type: PersonaAsistenciaFichaDto, isArray: true })
  items!: PersonaAsistenciaFichaDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

export class PaginatedPersonaObligacionesResponseDto {
  @ApiProperty({ type: PersonaObligacionFichaDto, isArray: true })
  items!: PersonaObligacionFichaDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

export class PaginatedPersonaPagosResponseDto {
  @ApiProperty({ type: PersonaPagoFichaDto, isArray: true })
  items!: PersonaPagoFichaDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
