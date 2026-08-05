import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const TENANT_USER_ESTADOS = ['ACTIVO', 'INACTIVO'] as const;
export const TENANT_USER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;

export type TenantUserEstado = (typeof TENANT_USER_ESTADOS)[number];
export type TenantUserRole = (typeof TENANT_USER_ROLES)[number];

export class QueryTenantUsersDto {
  @ApiPropertyOptional({ enum: TENANT_USER_ESTADOS, default: 'ACTIVO' })
  @IsOptional()
  @IsIn(TENANT_USER_ESTADOS)
  estado?: TenantUserEstado;

  @ApiPropertyOptional({ enum: TENANT_USER_ROLES })
  @IsOptional()
  @IsIn(TENANT_USER_ROLES)
  role?: TenantUserRole;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
