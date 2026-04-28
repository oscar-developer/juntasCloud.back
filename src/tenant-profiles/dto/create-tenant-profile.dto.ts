import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantProfileDto {
  @ApiProperty({ example: 'Administrador', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Perfil con acceso administrativo' })
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
