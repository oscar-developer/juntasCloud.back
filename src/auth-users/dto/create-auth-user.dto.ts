import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthUserDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  email!: string;

  @ApiProperty({ example: '$2b$10$K7LwMAsxkB....', maxLength: 255 })
  passwordHash!: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado?: 'ACTIVO' | 'INACTIVO';
}
