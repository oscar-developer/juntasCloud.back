import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';

export class CreateTenantInvitationDto {
  @ApiProperty({ example: 'nuevo@correo.com', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' })
  @IsIn(['ADMIN', 'MEMBER'])
  role!: 'ADMIN' | 'MEMBER';
}
