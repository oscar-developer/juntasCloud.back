import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportesCajaService } from './reportes-caja.service';

describe('ReportesCajaService', () => {
  let service: ReportesCajaService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new ReportesCajaService(prisma as unknown as PrismaService);
  });

  it('retorna el reporte mapeado a camelCase', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([
        {
          reporte: {
            periodo: {
              fechaInicio: '2026-01-01',
              fechaFin: '2026-12-31',
            },
            resumen: {
              saldoInicial: '1000.50',
              totalIngresos: '5000',
              totalGastos: '2500',
              saldoFinal: '3500.50',
            },
            porCategoria: [
              {
                tipo: 'INGRESO',
                categoria: 'Cuotas',
                total: '1500',
              },
            ],
            detalleMovimientos: [
              {
                fecha: '2026-04-26',
                tipo: 'INGRESO',
                categoria: 'Cuotas',
                descripcion: 'Ingreso comunal',
                monto: '500',
                medio_pago: 'TRANSFERENCIA',
                doc_referencia: 'REC-0001',
              },
            ],
          },
        },
      ]),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.getRendicionCuentas(2n, 9n, { idJunta: 4 });

    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_reporte_rendicion_cuentas(${4n}) AS reporte`,
    );
    expect(result).toEqual({
      periodo: {
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      },
      resumen: {
        saldoInicial: 1000.5,
        totalIngresos: 5000,
        totalGastos: 2500,
        saldoFinal: 3500.5,
      },
      porCategoria: [
        {
          tipo: 'INGRESO',
          categoria: 'Cuotas',
          total: 1500,
        },
      ],
      detalleMovimientos: [
        {
          fecha: '2026-04-26',
          tipo: 'INGRESO',
          categoria: 'Cuotas',
          descripcion: 'Ingreso comunal',
          monto: 500,
          medioPago: 'TRANSFERENCIA',
          docReferencia: 'REC-0001',
        },
      ],
    });
  });

  it('retorna colecciones vacias y resumen en cero cuando la funcion no trae datos', async () => {
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

    const result = await service.getRendicionCuentas(2n, 9n, { idJunta: 4 });

    expect(result).toEqual({
      periodo: {
        fechaInicio: null,
        fechaFin: null,
      },
      resumen: {
        saldoInicial: 0,
        totalIngresos: 0,
        totalGastos: 0,
        saldoFinal: 0,
      },
      porCategoria: [],
      detalleMovimientos: [],
    });
  });

  it('rechaza cuando el usuario no pertenece al tenant activo', async () => {
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

    await expect(service.getRendicionCuentas(2n, 9n, { idJunta: 4 })).rejects.toEqual(
      new ForbiddenException('El usuario no pertenece al tenant activo.'),
    );
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('traduce el error de junta inexistente a NotFound', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError(
          'No existe la junta o no pertenece al tenant actual',
          { clientVersion: '7.0.0' },
        ),
      ),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.getRendicionCuentas(2n, 9n, { idJunta: 999 })).rejects.toEqual(
      new NotFoundException('No se encontro la junta directiva indicada en el tenant activo.'),
    );
  });
});
