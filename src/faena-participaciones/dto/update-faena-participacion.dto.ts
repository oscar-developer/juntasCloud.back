import { PartialType } from '@nestjs/swagger';
import { CreateFaenaParticipacionDto } from './create-faena-participacion.dto';

export class UpdateFaenaParticipacionDto extends PartialType(CreateFaenaParticipacionDto) {}
