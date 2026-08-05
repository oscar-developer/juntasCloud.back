import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTenantInvitationDto {
  @ApiProperty({ example: 'nuevo@correo.com', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' })
  @IsIn(['ADMIN', 'MEMBER'])
  role!: 'ADMIN' | 'MEMBER';

  @ApiProperty({ example: 1, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  idProfile?: number | null;

  @ApiProperty({ example: 7, required: false, minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;

  @ApiProperty({ example: 'Bienvenido al tenant.', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
