import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TopService } from './top.service';

describe('TopService', () => {
  let service: TopService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new TopService(prisma as unknown as PrismaService);
  });

  it('retorna el top deudores como array JSON', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([
        { reporte: [{ id_persona: 1, nombres: 'Ana', deuda_total: 200 }] },
      ]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getTopDeudores(2n, 9n, 5);

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_top_deudores(${2n}, ${5}) AS reporte`,
    );
    expect(result).toEqual([{ id_persona: 1, nombres: 'Ana', deuda_total: 200 }]);
  });

  it('usa array vacio cuando la funcion no retorna datos', async () => {
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

    const result = await service.getTopDeudores(2n, 9n, 10);
    expect(result).toEqual([]);
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

    await expect(service.getTopDeudores(2n, 9n, 10)).rejects.toEqual(
      new ForbiddenException('El usuario no pertenece al tenant activo.'),
    );
  });

  it('traduce errores de tenant faltante', async () => {
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

    await expect(service.getTopDeudores(2n, 9n, 10)).rejects.toEqual(
      new BadRequestException(
        'No se pudo generar el reporte porque falta contexto de tenant en la sesion.',
      ),
    );
  });
});
