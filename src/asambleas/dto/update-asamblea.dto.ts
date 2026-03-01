import { PartialType } from '@nestjs/swagger';
import { CreateAsambleaDto } from './create-asamblea.dto';

export class UpdateAsambleaDto extends PartialType(CreateAsambleaDto) {}
