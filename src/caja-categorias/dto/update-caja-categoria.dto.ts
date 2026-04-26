import { PartialType } from '@nestjs/swagger';
import { CreateCajaCategoriaDto } from './create-caja-categoria.dto';

export class UpdateCajaCategoriaDto extends PartialType(CreateCajaCategoriaDto) {}
