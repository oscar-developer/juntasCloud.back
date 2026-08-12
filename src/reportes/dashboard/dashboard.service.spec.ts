import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    $transaction: jest.Mock;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withTenantContext: jest.fn((_userId, _tenantId, fn) => prisma.$transaction(fn)),
    };
    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('retorna el JSON del dashboard general', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([
        {
          reporte: JSON.stringify({
            caja: { saldoActual: 110 },
            personas: { total: 8, padronados: 5 },
            obligaciones: { pendientes: 3, deudaTotal: 260.5 },
            faenas: { programadas: 2 },
            asambleas: { proximas: 1 },
          }),
        },
      ]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getDashboardGeneral(2n, 9n);

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT public.fn_dashboard_general(${2n})::text AS reporte`,
    );
    expect(result).toEqual({
      caja: { saldoActual: 110 },
      personas: { total: 8, padronados: 5 },
      obligaciones: { pendientes: 3, deudaTotal: 260.5 },
      faenas: { programadas: 2 },
      asambleas: { proximas: 1 },
    });
  });

  it('rechaza si el usuario no pertenece al tenant activo', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn(),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.getDashboardGeneral(2n, 9n)).rejects.toEqual(
      new ForbiddenException('El usuario no pertenece al tenant activo.'),
    );
  });

  it('retorna dashboard vacio si la funcion no devuelve resultado', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: null }]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.getDashboardGeneral(2n, 9n)).resolves.toEqual({
      caja: { saldoActual: 0 },
      personas: { total: 0, padronados: 0 },
      obligaciones: { pendientes: 0, deudaTotal: 0 },
      faenas: { programadas: 0 },
      asambleas: { proximas: 0 },
    });
  });
});
