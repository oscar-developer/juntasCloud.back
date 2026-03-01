import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularCajaMovimientoDto {
  @ApiProperty({ example: 'Asiento incorrecto' })
  @IsString()
  @MinLength(1)
  motivoAnulacion!: string;
}
