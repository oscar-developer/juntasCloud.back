import { ApiProperty } from '@nestjs/swagger';

export class PersonaResponseDto {
  @ApiProperty({ type: Number, example: 1 })
  idTenant!: number;

  @ApiProperty({ type: Number, example: 1 })
  idPersona!: number;

  @ApiProperty({ type: Number, nullable: true, example: 25 })
  nroPadron!: number | null;

  @ApiProperty({ example: 'Juan' })
  nombres!: string;

  @ApiProperty({ example: 'Perez' })
  apellidoPaterno!: string;

  @ApiProperty({ example: 'Gomez' })
  apellidoMaterno!: string;

  @ApiProperty({ type: String, nullable: true, example: '12345678' })
  dni!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'juan@correo.com' })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '999888777' })
  telefono!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Av. Principal 123' })
  direccion!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Frente al parque central' })
  referenciaVivienda!: string | null;

  @ApiProperty({ enum: ['PADRONADO', 'NO_PADRONADO', 'INVITADO'] })
  tipoParticipante!: string;

  @ApiProperty({ enum: ['ACTIVO', 'SUSPENDIDO', 'RETIRADO', 'FALLECIDO'] })
  estado!: string;

  @ApiProperty({ example: '2026-02-28T00:00:00.000Z' })
  fechaRegistro!: Date;

  @ApiProperty({ nullable: true, example: '2026-03-13T00:00:00.000Z' })
  fechaBaja!: Date | null;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
