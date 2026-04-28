import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';

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
