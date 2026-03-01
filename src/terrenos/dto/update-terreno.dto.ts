import { PartialType } from '@nestjs/swagger';
import { CreateTerrenoDto } from './create-terreno.dto';

export class UpdateTerrenoDto extends PartialType(CreateTerrenoDto) {}
