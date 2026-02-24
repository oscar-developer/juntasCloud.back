import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuthUserDto {
  @ApiPropertyOptional({ example: 'nuevo_correo@correo.com', maxLength: 120 })
  email?: string;

  @ApiPropertyOptional({ example: '$2b$10$K7LwMAsxkB....', maxLength: 255 })
  passwordHash?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] })
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({
    nullable: true,
    description: 'Fecha/hora de ultimo login en formato ISO-8601',
    example: '2026-02-24T16:10:00.000Z',
  })
  lastLoginAt?: string | null;
}
