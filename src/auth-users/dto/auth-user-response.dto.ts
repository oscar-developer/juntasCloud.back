import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: 1 })
  idUser!: number;

  @ApiProperty({ example: 'usuario@correo.com' })
  email!: string;

  @ApiProperty({ example: 'Oscar' })
  nombres!: string;

  @ApiProperty({ example: 'Clemente' })
  apellidos!: string;

  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] })
  estado!: string;

  @ApiProperty({ example: false })
  emailVerified!: boolean;

  @ApiProperty({ example: '2026-02-24T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-02-24T15:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ nullable: true, example: '2026-02-24T16:10:00.000Z' })
  lastLoginAt!: Date | null;
}
