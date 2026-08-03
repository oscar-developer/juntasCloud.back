import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBienDto {
  @ApiProperty({ example: 'Motobomba', maxLength: 200 })
  @IsString() @MinLength(1) @MaxLength(200)
  descripcion!: string;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Equipo', maxLength: 50 })
  @IsOptional() @IsString() @MaxLength(50)
  tipo?: string | null;
  @ApiProperty({ type: Number, example: 1, minimum: 1 })
  @Type(() => Number) @IsInt() @Min(1)
  cantidad!: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1500.5 })
  @IsOptional() @Type(() => Number) @IsNumber()
  valorEstimado?: number | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Almacen comunal', maxLength: 200 })
  @IsOptional() @IsString() @MaxLength(200)
  ubicacion?: string | null;
  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fechaAlta!: string;
  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-03-20' })
  @IsOptional() @IsDateString()
  fechaBaja?: string | null;
  @ApiPropertyOptional({ enum: ['BUENO', 'REGULAR', 'MALO', 'DADO_DE_BAJA'] })
  @IsOptional() @IsIn(['BUENO', 'REGULAR', 'MALO', 'DADO_DE_BAJA'])
  estado?: 'BUENO' | 'REGULAR' | 'MALO' | 'DADO_DE_BAJA';
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional() @IsString()
  observaciones?: string | null;
}
