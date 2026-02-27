import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ example: '1' })
  idTenant!: string;

  @ApiProperty({ example: 'Junta Directiva Los Alamos' })
  nombre!: string;

  @ApiProperty({ type: String, nullable: true, example: '20123456789' })
  ruc!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '12345678' })
  dni!: string | null;

  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] })
  estado!: string;

  @ApiProperty({ example: '2026-02-24T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ nullable: true, example: 'Tenant creado desde API' })
  observaciones!: string | null;

  @ApiProperty({ nullable: true, example: '1' })
  ownerUserId!: string | null;
}
