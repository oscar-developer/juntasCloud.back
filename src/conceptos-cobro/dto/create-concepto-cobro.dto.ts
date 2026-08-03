import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const TIPOS = [
  'CUOTA_ORDINARIA',
  'CUOTA_EXTRAORDINARIA',
  'MULTA_FAENA',
  'MULTA_ASAMBLEA',
  'APORTE',
  'OTRO',
] as const;

export class CreateConceptoCobroDto {
  @ApiProperty({ example: 'Cuota ordinaria', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  requierePeriodo?: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
