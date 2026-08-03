import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ type: Number, example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 'Junta Directiva Los Alamos' })
  nombre!: string;

  @ApiProperty({ type: String, nullable: true, example: 'RUC' })
  tipoDocumento!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '20123456789' })
  numeroDocumento!: string | null;

  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] })
  estado!: string;

  @ApiProperty({ example: '2026-02-24T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ nullable: true, example: 'Tenant creado desde API' })
  observaciones!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  ownerUserId!: number | null;
}
