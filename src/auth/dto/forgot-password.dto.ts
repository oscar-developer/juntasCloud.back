import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  email!: string;
}
