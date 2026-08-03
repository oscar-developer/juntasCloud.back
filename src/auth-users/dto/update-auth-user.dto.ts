import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAuthUserDto {
  @ApiPropertyOptional({ example: 'nuevo_correo@correo.com', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Oscar', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres?: string;

  @ApiPropertyOptional({ example: 'Clemente', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos?: string;

  @ApiPropertyOptional({ example: 'miclave2026' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  clave?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: 'ACTIVO' | 'INACTIVO';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Fecha/hora de verificacion de correo en formato ISO-8601',
    example: '2026-02-24T16:10:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Fecha/hora de ultimo login en formato ISO-8601',
    example: '2026-02-24T16:10:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: string | null;
}
