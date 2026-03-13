import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'tu_password' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ example: 'Oscar', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres!: string;

  @ApiProperty({ example: 'Clemente', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos!: string;
}
