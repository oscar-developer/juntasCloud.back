import { ApiProperty } from '@nestjs/swagger';
import { CajaMovimientoResponseDto } from './caja-movimiento-response.dto';

export class PaginatedCajaMovimientosResponseDto {
  @ApiProperty({ type: CajaMovimientoResponseDto, isArray: true })
  items!: CajaMovimientoResponseDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
