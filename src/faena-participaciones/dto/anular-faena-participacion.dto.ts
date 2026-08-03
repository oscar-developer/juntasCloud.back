import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularFaenaParticipacionDto {
  @ApiProperty({ example: 'Registro duplicado' })
  @IsString()
  @MinLength(1)
  motivoAnulacion!: string;
}
