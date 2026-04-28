import { Module } from '@nestjs/common';
import { AppModulesController } from './app-modules.controller';
import { AppModulesService } from './app-modules.service';

@Module({
  controllers: [AppModulesController],
  providers: [AppModulesService],
})
export class AppModulesModule {}
