import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTenantProfileDto {
  @ApiPropertyOptional({ example: 'Tesorero', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Gestiona caja y finanzas.', nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
