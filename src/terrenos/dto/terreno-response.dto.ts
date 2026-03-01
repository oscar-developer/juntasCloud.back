import { ApiProperty } from '@nestjs/swagger';

export class TerrenoResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 10 })
  idTerreno!: number;

  @ApiProperty({ example: 'Lote 1 sector norte' })
  descripcion!: string;

  @ApiProperty({ type: Number, nullable: true, example: 1200.5 })
  areaAproxM2!: number | null;

  @ApiProperty({
    enum: ['EN_USO', 'EN_VENTA', 'VENDIDO_PARCIAL', 'VENDIDO_TOTAL', 'RESERVA'],
  })
  estado!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Observaciones del terreno' })
  observaciones!: string | null;
}
