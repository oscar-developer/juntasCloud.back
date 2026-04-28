import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppModulesService } from './app-modules.service';
import { AppModuleResponseDto } from './dto/app-module-response.dto';

@ApiTags('app-modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('app-modules')
export class AppModulesController {
  constructor(private readonly service: AppModulesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar modulos globales de la aplicacion' })
  @ApiOkResponse({ type: AppModuleResponseDto, isArray: true })
  findAll(): Promise<AppModuleResponseDto[]> {
    return this.service.findAll();
  }
}
