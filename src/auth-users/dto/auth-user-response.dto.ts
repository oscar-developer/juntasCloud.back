import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: '1' })
  idUser!: string;

  @ApiProperty({ example: 'usuario@correo.com' })
  email!: string;

  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] })
  estado!: string;

  @ApiProperty({ example: '2026-02-24T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ nullable: true, example: '2026-02-24T16:10:00.000Z' })
  lastLoginAt!: Date | null;
}
