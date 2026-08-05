import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppModuleResponseDto } from './dto/app-module-response.dto';

type AppModuleRecord = {
  module_code: string;
  nombre: string;
  grupo: string;
  orden: number;
  estado: boolean;
};

@Injectable()
export class AppModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AppModuleResponseDto[]> {
    const modules = await this.prisma.app_modules.findMany({
      orderBy: [{ grupo: 'asc' }, { orden: 'asc' }, { module_code: 'asc' }],
    });

    return modules.map((module) => this.toResponse(module));
  }

  private toResponse(module: AppModuleRecord): AppModuleResponseDto {
    return {
      moduleCode: module.module_code,
      nombre: module.nombre,
      grupo: module.grupo,
      orden: module.orden,
      activo: module.estado,
    };
  }
}
