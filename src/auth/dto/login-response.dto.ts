import { ApiProperty } from '@nestjs/swagger';

class LoginUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'oscar@villaunion.pe' })
  email!: string;

  @ApiProperty({ example: 'Oscar' })
  nombres!: string;

  @ApiProperty({ example: 'Clemente' })
  apellidos!: string;

  @ApiProperty({ example: false })
  emailVerified!: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}
