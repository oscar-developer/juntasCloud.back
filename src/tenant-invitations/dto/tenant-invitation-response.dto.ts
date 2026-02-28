import { ApiProperty } from '@nestjs/swagger';

export class TenantInvitationResponseDto {
  @ApiProperty({ example: 1 })
  idInvitation!: number;

  @ApiProperty({ example: '1' })
  idTenant!: string;

  @ApiProperty({ example: 'nuevo@correo.com' })
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'] })
  role!: string;

  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'REVOKED'] })
  status!: string;

  @ApiProperty({ example: '2026-03-02T12:00:00.000Z' })
  expiresAt!: Date;

  @ApiProperty({ example: 1 })
  invitedBy!: number;

  @ApiProperty({ example: '2026-02-28T12:00:00.000Z' })
  createdAt!: Date;
}
