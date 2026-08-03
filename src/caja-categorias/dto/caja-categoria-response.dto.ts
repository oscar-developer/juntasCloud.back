import { ApiProperty } from '@nestjs/swagger';

export class CajaCategoriaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 1 })
  idCategoriaCaja!: number;

  @ApiProperty({ example: 'Cuotas' })
  nombre!: string;

  @ApiProperty({ example: 'INGRESO' })
  tipo!: string;

  @ApiProperty({ example: true })
  activo!: boolean;
}
