import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RegistrarTardanzaAsambleaDto {
  @ApiProperty({ example: '18:45:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'horaLlegada debe tener formato HH:mm o HH:mm:ss.',
  })
  horaLlegada!: string;

  @ApiProperty({ type: Boolean, example: false })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  cobrarAhora!: boolean;

  @ApiPropertyOptional({ example: 'EFECTIVO', nullable: true, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  medioPago?: string | null;
}
