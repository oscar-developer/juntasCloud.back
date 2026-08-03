import { PartialType } from '@nestjs/swagger';
import { CreateConceptoCobroDto } from './create-concepto-cobro.dto';

export class UpdateConceptoCobroDto extends PartialType(CreateConceptoCobroDto) {}
