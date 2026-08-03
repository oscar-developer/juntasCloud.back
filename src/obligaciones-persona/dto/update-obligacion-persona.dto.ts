import { PartialType } from '@nestjs/swagger';
import { CreateObligacionPersonaDto } from './create-obligacion-persona.dto';

export class UpdateObligacionPersonaDto extends PartialType(CreateObligacionPersonaDto) {}
