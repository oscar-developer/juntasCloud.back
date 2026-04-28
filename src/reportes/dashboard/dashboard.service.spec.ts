import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('retorna el JSON del dashboard general', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: { caja: { saldoActual: 100 } } }]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getDashboardGeneral(2n, 9n);

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_dashboard_general(${2n}) AS reporte`,
    );
    expect(result).toEqual({ caja: { saldoActual: 100 } });
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

  it('traduce errores de contexto tenant faltante', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError('app.tenant_id no configurado', {
          clientVersion: '7.0.0',
        }),
      ),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.getDashboardGeneral(2n, 9n)).rejects.toEqual(
      new BadRequestException(
        'No se pudo generar el dashboard porque falta contexto de tenant en la sesion.',
      ),
    );
  });
});
