import { PartialType } from '@nestjs/swagger';
import { CreateJuntaDirectivaDto } from './create-junta-directiva.dto';

export class UpdateJuntaDirectivaDto extends PartialType(CreateJuntaDirectivaDto) {}
