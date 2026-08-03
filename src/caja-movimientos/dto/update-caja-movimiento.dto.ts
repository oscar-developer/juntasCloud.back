import { PartialType } from '@nestjs/swagger';
import { CreateCajaMovimientoDto } from './create-caja-movimiento.dto';

export class UpdateCajaMovimientoDto extends PartialType(CreateCajaMovimientoDto) {}
