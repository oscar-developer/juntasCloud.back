import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularCreditoPersonaDto {
  @ApiProperty({ example: 'Crédito registrado por error' })
  @IsString()
  @MinLength(1)
  motivoAnulacion!: string;
}
