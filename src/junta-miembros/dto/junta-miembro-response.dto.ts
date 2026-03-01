import { ApiProperty } from '@nestjs/swagger';

export class JuntaMiembroResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idJuntaMiembro!: number;

  @ApiProperty({ example: 1 })
  idJunta!: number;

  @ApiProperty({ example: 10 })
  idPersona!: number;

  @ApiProperty({ example: 'PRESIDENTE' })
  cargo!: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  fechaInicio!: Date;

  @ApiProperty({ type: String, nullable: true, example: '2026-12-31T00:00:00.000Z' })
  fechaFin!: Date | null;
}
