import { PrismaService } from '../prisma/prisma.service';
import { AppModulesService } from './app-modules.service';

describe('AppModulesService', () => {
  let service: AppModulesService;
  let prisma: {
    app_modules: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      app_modules: {
        findMany: jest.fn(),
      },
    };

    service = new AppModulesService(prisma as unknown as PrismaService);
  });

  it('findAll lista modulos globales ordenados y mapea camelCase', async () => {
    prisma.app_modules.findMany.mockResolvedValue([
      {
        module_code: 'personas',
        nombre: 'Personas',
        grupo: 'Padron',
        orden: 10,
        estado: true,
      },
    ]);

    const result = await service.findAll();

    expect(prisma.app_modules.findMany).toHaveBeenCalledWith({
      orderBy: [{ grupo: 'asc' }, { orden: 'asc' }, { module_code: 'asc' }],
    });
    expect(result).toEqual([
      {
        moduleCode: 'personas',
        nombre: 'Personas',
        grupo: 'Padron',
        orden: 10,
        activo: true,
      },
    ]);
  });
});
