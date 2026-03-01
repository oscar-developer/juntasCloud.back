import { ApiProperty } from '@nestjs/swagger';

export class FaenaResponseDto {
  @ApiProperty({ example: 1 })
  idTenant!: number;
  @ApiProperty({ example: 8 })
  idFaena!: number;
  @ApiProperty({ example: '2026-03-10T00:00:00.000Z' })
  fecha!: Date;
  @ApiProperty({ example: 'Faena comunal' })
  descripcion!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Sector norte' })
  lugar!: string | null;
  @ApiProperty({ type: String, nullable: true, example: 'Observaciones' })
  observaciones!: string | null;
}
