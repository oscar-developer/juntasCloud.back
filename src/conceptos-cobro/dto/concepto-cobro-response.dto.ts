import { ApiProperty } from '@nestjs/swagger';

export class ConceptoCobroResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idConceptoCobro!: number;

  @ApiProperty({ example: 'Cuota ordinaria' })
  nombre!: string;

  @ApiProperty({ example: 'CUOTA_ORDINARIA' })
  tipo!: string;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiProperty({ example: true })
  requierePeriodo!: boolean;

  @ApiProperty({ type: String, nullable: true })
  observaciones!: string | null;
}
