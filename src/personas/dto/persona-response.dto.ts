import { ApiProperty } from '@nestjs/swagger';

export class PersonaResponseDto {
  @ApiProperty({ example: '1' })
  idTenant!: string;

  @ApiProperty({ example: '1' })
  idPersona!: string;

  @ApiProperty({ example: 'Juan' })
  nombres!: string;

  @ApiProperty({ example: 'Perez' })
  apellidoPaterno!: string;

  @ApiProperty({ example: 'Gomez' })
  apellidoMaterno!: string;

  @ApiProperty({ type: String, nullable: true, example: '12345678' })
  dni!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '999888777' })
  telefono!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Frente al parque central' })
  referenciaVivienda!: string | null;

  @ApiProperty({ enum: ['PADRONADO', 'NO_PADRONADO', 'INVITADO'] })
  tipoParticipante!: string;

  @ApiProperty({ enum: ['ACTIVO', 'SUSPENDIDO', 'RETIRADO'] })
  estado!: string;

  @ApiProperty({ example: '2026-02-28T00:00:00.000Z' })
  fechaRegistro!: Date;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
