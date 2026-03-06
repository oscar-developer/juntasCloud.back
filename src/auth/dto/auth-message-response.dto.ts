import { ApiProperty } from '@nestjs/swagger';

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Si el correo existe, enviaremos instrucciones.' })
  message!: string;
}
