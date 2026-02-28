import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/auth/roles.guard';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';

@Module({
  controllers: [PersonasController],
  providers: [PersonasService, RolesGuard],
})
export class PersonasModule {}
