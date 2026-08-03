import { PartialType } from '@nestjs/swagger';
import { CreateJuntaMiembroDto } from './create-junta-miembro.dto';

export class UpdateJuntaMiembroDto extends PartialType(CreateJuntaMiembroDto) {}
