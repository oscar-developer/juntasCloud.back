import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFaenaDto {
  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: 'Faena comunal', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descripcion!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Sector norte', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
