import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const TIPOS = ['INGRESO', 'GASTO'];

export class CreateCajaCategoriaDto {
  @ApiProperty({ example: 'Cuotas', maxLength: 100 })
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
}
