import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularObligacionPersonaDto {
  @ApiProperty({ example: 'Registro incorrecto' })
  @IsString()
  @MinLength(1)
  motivoAnulacion!: string;
}
