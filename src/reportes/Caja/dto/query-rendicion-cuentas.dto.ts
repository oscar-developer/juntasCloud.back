import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class QueryRendicionCuentasDto {
  @ApiProperty({
    type: Number,
    example: 1,
    minimum: 1,
    description: 'id_junta dentro del tenant activo',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idJunta!: number;
}
