import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryTopDeudoresDto {
  @ApiPropertyOptional({
    type: Number,
    example: 10,
    minimum: 1,
    default: 10,
    description: 'Cantidad maxima de personas a retornar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number;
}
