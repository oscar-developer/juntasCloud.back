import { ApiProperty } from '@nestjs/swagger';

export class TenantInvitationResponseDto {
  @ApiProperty({ example: 1 })
  idInvitation!: number;

  @ApiProperty({ type: Number, example: 1 })
  idTenant!: number;

  @ApiProperty({ example: 'nuevo@correo.com' })
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'] })
  role!: string;

  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED', 'EXPIRED'] })
  status!: string;

  @ApiProperty({ example: '2026-03-02T12:00:00.000Z' })
  expiresAt!: Date;

  @ApiProperty({ nullable: true, example: '2026-03-01T12:00:00.000Z' })
  acceptedAt!: Date | null;

  @ApiProperty({ nullable: true, example: '2026-03-01T12:00:00.000Z' })
  revokedAt!: Date | null;

  @ApiProperty({ nullable: true, example: '2026-03-01T12:00:00.000Z' })
  rejectedAt!: Date | null;

  @ApiProperty({ example: 1 })
  invitedBy!: number;

  @ApiProperty({ example: '2026-02-28T12:00:00.000Z' })
  createdAt!: Date;
}
