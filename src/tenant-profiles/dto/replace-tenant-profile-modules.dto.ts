import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsIn, IsString, MaxLength, ValidateNested } from 'class-validator';

export const ACCESS_LEVELS = ['SIN_ACCESO', 'SOLO_LECTURA', 'ACCESO_TOTAL'] as const;

export class TenantProfileModuleConfigDto {
  @ApiProperty({ example: 'personas', maxLength: 80 })
  @IsString()
  @MaxLength(80)
  moduleCode!: string;

  @ApiProperty({ enum: ACCESS_LEVELS, example: 'ACCESO_TOTAL' })
  @IsIn(ACCESS_LEVELS)
  accessLevel!: (typeof ACCESS_LEVELS)[number];
}

export class ReplaceTenantProfileModulesDto {
  @ApiProperty({
    type: TenantProfileModuleConfigDto,
    isArray: true,
    example: [
      { moduleCode: 'dashboard', accessLevel: 'SOLO_LECTURA' },
      { moduleCode: 'finanzas_caja', accessLevel: 'ACCESO_TOTAL' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantProfileModuleConfigDto)
  @ArrayUnique((module: TenantProfileModuleConfigDto) => module.moduleCode)
  modules!: TenantProfileModuleConfigDto[];
}
