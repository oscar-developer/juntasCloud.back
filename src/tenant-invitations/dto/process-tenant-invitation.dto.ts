import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ProcessTenantInvitationDto {
  @ApiProperty({ example: 'token-recibido-por-correo' })
  @IsString()
  @MinLength(1)
  token!: string;
}
