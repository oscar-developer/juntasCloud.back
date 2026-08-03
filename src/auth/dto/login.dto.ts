import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'oscar@villaunion.pe', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'tu_password' })
  @IsString()
  @MinLength(1)
  password!: string;
}
