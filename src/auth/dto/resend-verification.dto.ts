import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  email!: string;
}
