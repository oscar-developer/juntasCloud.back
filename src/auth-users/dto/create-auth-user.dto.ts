import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthUserDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  email!: string;

  @ApiProperty({ example: 'Oscar', maxLength: 100 })
  nombres!: string;

  @ApiProperty({ example: 'Clemente', maxLength: 100 })
  apellidos!: string;

  @ApiProperty({ example: 'miclave2026' })
  clave!: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado?: 'ACTIVO' | 'INACTIVO';
}
