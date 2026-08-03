import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateObligacionPagoDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMovimiento!: number;

  @ApiProperty({ type: Number, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  montoAplicado!: number;
}
