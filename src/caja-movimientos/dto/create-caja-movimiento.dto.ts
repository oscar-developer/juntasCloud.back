import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const TIPOS = ['INGRESO', 'GASTO'];
const CATEGORIAS = [
  'APORTE',
  'MULTA_FAENA',
  'MULTA_ASAMBLEA',
  'APORTE_VOLUNTARIO',
  'DONACION',
  'SALDO_INICIAL_JUNTA_ANTERIOR',
  'OTRO_INGRESO',
  'GASTO_OPERATIVO',
  'MATERIAL_OBRA',
  'MOVILIDAD',
  'REUNION',
  'SERVICIOS',
  'COMPRA_BIEN',
  'OTRO_GASTO',
];
const MEDIOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'OTRO'];

export class CreateCajaMovimientoDto {
  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @ApiProperty({ type: Number, example: 100.5, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto!: number;

  @ApiProperty({ enum: CATEGORIAS })
  @IsIn(CATEGORIAS)
  categoria!: (typeof CATEGORIAS)[number];

  @ApiProperty({ enum: MEDIOS_PAGO })
  @IsIn(MEDIOS_PAGO)
  medioPago!: (typeof MEDIOS_PAGO)[number];

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPersona?: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idFaena?: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idAsamblea?: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idBien?: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Pago de aporte comunal' })
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'REC-0001' })
  @IsOptional()
  @IsString()
  docReferencia?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
