import { ApiProperty } from '@nestjs/swagger';

export class FaenaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;
  @ApiProperty({ example: 8 })
  idFaena!: number;
  @ApiProperty({ example: '2026-03-10T00:00:00.000Z' })
  fechaProgramada!: Date;
  @ApiProperty({ type: String, nullable: true, example: '1970-01-01T08:00:00.000Z' })
  horaInicio!: Date | null;
  @ApiProperty({ type: String, nullable: true, example: '1970-01-01T12:30:00.000Z' })
  horaFin!: Date | null;
  @ApiProperty({ example: 'Faena comunal' })
  descripcion!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Sector norte' })
  lugar!: string | null;
  @ApiProperty({ example: 'ORDINARIA' })
  tipoFaena!: string;
  @ApiProperty({ example: true })
  esObligatoria!: boolean;
  @ApiProperty({ example: 'PROGRAMADA' })
  estado!: string;
  @ApiProperty({ type: Number, nullable: true, example: 15 })
  montoMultaBase!: number | null;
  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
