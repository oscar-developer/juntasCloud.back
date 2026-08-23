import { ApiProperty } from '@nestjs/swagger';

export class RegistrarTardanzaAsambleaResponseDto {
  @ApiProperty({ example: 1 })
  idAsistencia!: number;

  @ApiProperty({ example: 15 })
  idObligacion!: number;

  @ApiProperty({ type: Number, nullable: true, example: null })
  idMovimiento!: number | null;

  @ApiProperty({ example: 'PENDIENTE' })
  estadoObligacion!: string;
}
