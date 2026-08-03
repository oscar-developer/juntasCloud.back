import { ApiProperty } from '@nestjs/swagger';

export class BienResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;
  @ApiProperty({ example: 4 })
  idBien!: number;
  @ApiProperty({ example: 'Motobomba' })
  descripcion!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Equipo' })
  tipo!: string | null;
  @ApiProperty({ example: 1 })
  cantidad!: number;
  @ApiProperty({ type: Number, nullable: true, example: 1500.5 })
  valorEstimado!: number | null;
  @ApiProperty({ type: String, nullable: true, example: 'Almacen comunal' })
  ubicacion!: string | null;
  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  fechaAlta!: Date;
  @ApiProperty({ type: String, nullable: true, example: '2026-03-20T00:00:00.000Z' })
  fechaBaja!: Date | null;
  @ApiProperty({ enum: ['BUENO', 'REGULAR', 'MALO', 'DADO_DE_BAJA'] })
  estado!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
