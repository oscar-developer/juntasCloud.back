import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TenantProfileModuleConfigDto } from './replace-tenant-profile-modules.dto';

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

  @ApiPropertyOptional({
    type: TenantProfileModuleConfigDto,
    isArray: true,
    example: [
      { moduleCode: 'dashboard', accessLevel: 'SOLO_LECTURA' },
      { moduleCode: 'finanzas_caja', accessLevel: 'ACCESO_TOTAL' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantProfileModuleConfigDto)
  @ArrayUnique((module: TenantProfileModuleConfigDto) => module.moduleCode)
  modules?: TenantProfileModuleConfigDto[];
}
