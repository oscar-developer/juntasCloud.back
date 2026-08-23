import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AsistenciaAsambleaService } from './asistencia-asamblea.service';

describe('AsistenciaAsambleaService', () => {
  let service: AsistenciaAsambleaService;
  let prisma: {
    $transaction: jest.Mock;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withTenantContext: jest.fn((_userId, _tenantId, fn) => prisma.$transaction(fn)),
    };
    service = new AsistenciaAsambleaService(prisma as unknown as PrismaService);
  });

  it('registrarTardanza crea obligacion pendiente sin cobro inmediato', async () => {
    const tx = {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id_asistencia: 7n,
          id_obligacion: 21n,
          id_movimiento: null,
          estado_obligacion: 'PENDIENTE',
        },
      ]),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.registrarTardanza(2n, 9n, 7n, {
      horaLlegada: '18:45:00',
      cobrarAhora: false,
    });

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`
            SELECT *
            FROM public.fn_registrar_tardanza_asamblea(
              ${2n},
              ${7n},
              ${'18:45:00'}::time,
              ${false},
              ${null},
              ${9n}
            )
          `,
    );
    expect(result).toEqual({
      idAsistencia: 7,
      idObligacion: 21,
      idMovimiento: null,
      estadoObligacion: 'PENDIENTE',
    });
  });

  it('registrarTardanza crea movimiento cuando cobra de inmediato', async () => {
    const tx = {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id_asistencia: 7n,
          id_obligacion: 21n,
          id_movimiento: 34n,
          estado_obligacion: 'PAGADA',
        },
      ]),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.registrarTardanza(2n, 9n, 7n, {
      horaLlegada: '18:45',
      cobrarAhora: true,
      medioPago: 'EFECTIVO',
    });

    expect(result).toEqual({
      idAsistencia: 7,
      idObligacion: 21,
      idMovimiento: 34,
      estadoObligacion: 'PAGADA',
    });
  });

  it('registrarTardanza rechaza medioPago ausente si cobra ahora', async () => {
    await expect(
      service.registrarTardanza(2n, 9n, 7n, {
        horaLlegada: '18:45:00',
        cobrarAhora: true,
      }),
    ).rejects.toEqual(
      new BadRequestException('medioPago es obligatorio cuando cobrarAhora es true.'),
    );
    expect(prisma.withTenantContext).not.toHaveBeenCalled();
  });

  it('registrarTardanza traduce asistencia inexistente', async () => {
    const tx = {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      $queryRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError('No se encontró la asistencia', {
          clientVersion: '7.0.0',
        }),
      ),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.registrarTardanza(2n, 9n, 7n, {
        horaLlegada: '18:45:00',
        cobrarAhora: false,
      }),
    ).rejects.toEqual(
      new NotFoundException('No se encontro la asistencia de asamblea solicitada.'),
    );
  });

  it('registrarTardanza rechaza usuario sin membresia activa', async () => {
    const tx = {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $queryRaw: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.registrarTardanza(2n, 9n, 7n, {
        horaLlegada: '18:45:00',
        cobrarAhora: false,
      }),
    ).rejects.toEqual(new ForbiddenException('El usuario no pertenece al tenant activo.'));
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
});
