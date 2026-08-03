import { PartialType } from '@nestjs/swagger';
import { CreateFaenaDto } from './create-faena.dto';

export class UpdateFaenaDto extends PartialType(CreateFaenaDto) {}
