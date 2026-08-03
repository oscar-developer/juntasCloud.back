import { ApiProperty } from '@nestjs/swagger';

export class TerrenoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 10 })
  idTerreno!: number;

  @ApiProperty({ type: String, nullable: true, example: 'LT-001' })
  codigoLote!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'MZ-A' })
  manzana!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '12' })
  numeroLote!: string | null;

  @ApiProperty({ example: 'Lote 1 sector norte' })
  descripcion!: string;

  @ApiProperty({ type: Number, nullable: true, example: 1200.5 })
  areaAproxM2!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 1180.25 })
  areaLegalM2!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'PR-2026-001' })
  partidaRegistral!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Sector norte, frente a la avenida' })
  ubicacion!: string | null;

  @ApiProperty({
    enum: ['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'],
  })
  estado!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones del terreno' })
  observaciones!: string | null;
}
