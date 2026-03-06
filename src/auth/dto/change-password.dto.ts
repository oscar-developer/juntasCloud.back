import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'ClaveActual2026' })
  currentPassword!: string;

  @ApiProperty({ example: 'NuevaClaveSegura2026' })
  newPassword!: string;
}
