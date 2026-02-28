import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantInvitationDto {
  @ApiProperty({ example: 'nuevo@correo.com', maxLength: 120 })
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' })
  role!: 'ADMIN' | 'MEMBER';
}
