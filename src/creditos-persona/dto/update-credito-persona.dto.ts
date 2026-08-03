import { PartialType } from '@nestjs/swagger';
import { CreateCreditoPersonaDto } from './create-credito-persona.dto';

export class UpdateCreditoPersonaDto extends PartialType(CreateCreditoPersonaDto) {}
