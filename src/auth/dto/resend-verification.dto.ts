import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;
}
