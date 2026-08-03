import { PartialType } from '@nestjs/swagger';
import { CreateAsistenciaAsambleaDto } from './create-asistencia-asamblea.dto';

export class UpdateAsistenciaAsambleaDto extends PartialType(CreateAsistenciaAsambleaDto) {}
