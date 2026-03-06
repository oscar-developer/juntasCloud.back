import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  email!: string;

  @ApiProperty({ example: 'tu_password' })
  password!: string;

  @ApiProperty({ example: 'Oscar', maxLength: 100 })
  nombres!: string;

  @ApiProperty({ example: 'Clemente', maxLength: 100 })
  apellidos!: string;
}
