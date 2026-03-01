import { ApiProperty } from '@nestjs/swagger';

export class AsambleaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;
  @ApiProperty({ example: 3 })
  idAsamblea!: number;
  @ApiProperty({ example: '2026-03-20T18:00:00.000Z' })
  fecha!: Date;
  @ApiProperty({ enum: ['ORDINARIA', 'EXTRAORDINARIA'] })
  tipo!: string;
  @ApiProperty({ example: 'Aprobacion de presupuesto' })
  temaPrincipal!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Local comunal' })
  lugar!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: 50 })
  quorumRequerido!: number | null;
  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
