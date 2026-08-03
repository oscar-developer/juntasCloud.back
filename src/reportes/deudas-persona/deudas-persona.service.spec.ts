import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DeudasPersonaService } from './deudas-persona.service';

describe('DeudasPersonaService', () => {
  let service: DeudasPersonaService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new DeudasPersonaService(prisma as unknown as PrismaService);
  });

  it('retorna el extracto JSON de la persona', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: { deuda: { totalDeuda: 50 } } }]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getExtracto(2n, 9n, 4n);

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_persona_extracto(${2n}, ${4n}) AS reporte`,
    );
    expect(result).toEqual({ deuda: { totalDeuda: 50 } });
  });

  it('retorna el resumen de deuda de la persona', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: { totalDeuda: 80 } }]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getDeuda(2n, 9n, 5n);

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_deuda_por_persona(${2n}, ${5n}) AS reporte`,
    );
    expect(result).toEqual({ totalDeuda: 80 });
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

    await expect(service.getFaenas(2n, 9n, 4n)).rejects.toEqual(
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

    await expect(service.getAsambleas(2n, 9n, 4n)).rejects.toEqual(
      new BadRequestException(
        'No se pudo generar el reporte porque falta contexto de tenant en la sesion.',
      ),
    );
  });
});
