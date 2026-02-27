import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'oscar@villaunion.pe', maxLength: 120 })
  email!: string;

  @ApiProperty({ example: 'tu_password' })
  password!: string;
}
