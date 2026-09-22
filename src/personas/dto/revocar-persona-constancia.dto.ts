import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevocarPersonaConstanciaDto {
  @ApiProperty({
    example: 'Documento emitido con informacion incorrecta',
    maxLength: 300,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  motivo!: string;
}
