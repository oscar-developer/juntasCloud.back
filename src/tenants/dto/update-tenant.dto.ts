import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Junta Directiva Los Alamos', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ type: String, example: 'RUC', maxLength: 15, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  tipoDocumento?: string | null;

  @ApiPropertyOptional({ type: String, example: '20123456789', maxLength: 20, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  numeroDocumento?: string | null;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'] })
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'])
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

  @ApiPropertyOptional({ example: 'Observacion de actualizacion', maxLength: 300, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string | null;
}
