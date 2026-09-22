import { ApiProperty } from '@nestjs/swagger';

export class PersonaConstanciaTenantDto {
  @ApiProperty({ example: 'Asociacion Villa Union' })
  nombre!: string;

  @ApiProperty({ type: String, nullable: true, example: 'RUC' })
  tipoDocumento!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '20123456789' })
  numeroDocumento!: string | null;
}

export class PersonaConstanciaPersonaDto {
  @ApiProperty({ example: 15 })
  idPersona!: number;

  @ApiProperty({ example: 'Perez Gomez, Juan Carlos' })
  nombreCompleto!: string;

  @ApiProperty({ type: String, nullable: true, example: '12345678' })
  dni!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 25 })
  nroPadron!: number | null;

  @ApiProperty({ example: 'PADRONADO' })
  tipoParticipante!: string;

  @ApiProperty({ example: 'ACTIVO' })
  estado!: string;

  @ApiProperty({ example: '2025-02-10' })
  fechaRegistro!: string;
}

export class PersonaConstanciaAsistenciaDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 7 })
  asistencias!: number;

  @ApiProperty({ example: 2 })
  faltas!: number;

  @ApiProperty({ example: 1 })
  tardanzas!: number;

  @ApiProperty({ example: 80 })
  porcentajeAsistencia!: number;
}

export class PersonaConstanciaResumenDto {
  @ApiProperty({ example: 125.5 })
  deudaPendienteTotal!: number;

  @ApiProperty({ type: PersonaConstanciaAsistenciaDto })
  faenas!: PersonaConstanciaAsistenciaDto;

  @ApiProperty({ type: PersonaConstanciaAsistenciaDto })
  asambleas!: PersonaConstanciaAsistenciaDto;

  @ApiProperty({ example: 2 })
  totalTerrenos!: number;
}

export class PersonaConstanciaJuntaDto {
  @ApiProperty({ type: Number, nullable: true, example: 3 })
  idJunta!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Junta Directiva 2026',
  })
  nombre!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2026-01-01' })
  fechaInicio!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2026-12-31' })
  fechaFin!: string | null;
}

export class PersonaConstanciaFirmanteDto {
  @ApiProperty({ enum: ['PRESIDENTE', 'SECRETARIO', 'TESORERO'] })
  cargo!: 'PRESIDENTE' | 'SECRETARIO' | 'TESORERO';

  @ApiProperty({ type: String, nullable: true, example: 'Ana Torres Ruiz' })
  nombreCompleto!: string | null;
}

export class PersonaConstanciaSnapshotDto {
  @ApiProperty({ type: PersonaConstanciaTenantDto })
  tenant!: PersonaConstanciaTenantDto;

  @ApiProperty({ type: PersonaConstanciaPersonaDto })
  persona!: PersonaConstanciaPersonaDto;

  @ApiProperty({ type: PersonaConstanciaResumenDto })
  resumen!: PersonaConstanciaResumenDto;

  @ApiProperty({ type: PersonaConstanciaJuntaDto })
  juntaDirectiva!: PersonaConstanciaJuntaDto;

  @ApiProperty({ type: PersonaConstanciaFirmanteDto, isArray: true })
  firmantes!: PersonaConstanciaFirmanteDto[];
}

export class PersonaConstanciaEmitidaDto {
  @ApiProperty({ example: 12 })
  idConstancia!: number;

  @ApiProperty({ example: 'CP-20260921-A1B2C3D4' })
  codigo!: string;

  @ApiProperty({ enum: ['VIGENTE', 'REVOCADA'], example: 'VIGENTE' })
  estado!: string;

  @ApiProperty({ example: '2026-09-21T15:45:00.000Z' })
  issuedAt!: string;

  @ApiProperty({
    example: 'https://app.example.com/verificar/constancia/token',
  })
  verificationUrl!: string;

  @ApiProperty({ example: 'a3f8...' })
  snapshotHash!: string;

  @ApiProperty({ type: PersonaConstanciaSnapshotDto })
  snapshot!: PersonaConstanciaSnapshotDto;
}

export class PersonaConstanciaVerificacionDto {
  @ApiProperty({ example: true })
  valida!: boolean;

  @ApiProperty({ enum: ['VIGENTE', 'REVOCADA'], example: 'VIGENTE' })
  estado!: string;

  @ApiProperty({ example: 'CP-20260921-A1B2C3D4' })
  codigo!: string;

  @ApiProperty({ example: '2026-09-21T15:45:00.000Z' })
  issuedAt!: string;

  @ApiProperty({ type: String, nullable: true })
  revokedAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  motivoRevocacion!: string | null;

  @ApiProperty({ type: PersonaConstanciaTenantDto })
  tenant!: PersonaConstanciaTenantDto;

  @ApiProperty({
    example: {
      nombreCompleto: 'Perez Gomez, Juan Carlos',
      dniEnmascarado: '****5678',
      nroPadron: 25,
      estado: 'ACTIVO',
    },
  })
  persona!: {
    nombreCompleto: string;
    dniEnmascarado: string | null;
    nroPadron: number | null;
    estado: string;
  };

  @ApiProperty({ example: 'a3f8...' })
  snapshotHash!: string;
}
