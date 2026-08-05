import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateAuthUserDto {
  @ApiProperty({ example: 'usuario@correo.com', maxLength: 120 })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Oscar', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres!: string;

  @ApiProperty({ example: 'Clemente', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos!: string;

  @ApiProperty({ example: 'miclave2026' })
  @IsString()
  @MinLength(1)
  clave!: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'], default: 'ACTIVO' })
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])
  estado?: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha/hora de verificacion de correo en formato ISO-8601',
    example: '2026-02-24T16:10:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: string;
}
