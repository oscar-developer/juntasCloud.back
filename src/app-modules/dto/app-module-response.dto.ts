import { ApiProperty } from '@nestjs/swagger';

export class AppModuleResponseDto {
  @ApiProperty({ example: 'personas' })
  moduleCode!: string;

  @ApiProperty({ example: 'Personas' })
  nombre!: string;

  @ApiProperty({ example: 'Padron' })
  grupo!: string;

  @ApiProperty({ example: 10 })
  orden!: number;

  @ApiProperty({ example: true })
  activo!: boolean;
}
