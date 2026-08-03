import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularAsistenciaAsambleaDto {
  @ApiProperty({ example: 'Error de digitacion' })
  @IsString()
  @MinLength(1)
  motivoAnulacion!: string;
}
