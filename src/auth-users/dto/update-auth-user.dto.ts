import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAuthUserDto {
  @ApiPropertyOptional({ example: 'Oscar', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres?: string;

  @ApiPropertyOptional({ example: 'Clemente', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos?: string;
}
