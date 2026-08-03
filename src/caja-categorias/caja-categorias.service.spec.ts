import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CajaCategoriasService } from './caja-categorias.service';

describe('CajaCategoriasService', () => {
  let service: CajaCategoriasService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new CajaCategoriasService(prisma as unknown as PrismaService);
  });

  it('create crea categoria con tenant context', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        create: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_categoria_caja: 15n,
          nombre: 'Cuotas',
          tipo: 'INGRESO',
          activo: true,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.create(2n, 9n, {
      nombre: ' Cuotas ',
      tipo: 'INGRESO',
    });

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.tenant_users.findFirst).toHaveBeenCalledWith({
      where: { id_tenant: 2n, id_user: 9n, estado: 'ACTIVO' },
      select: { id_user: true },
    });
    expect(tx.caja_categorias.create).toHaveBeenCalledWith({
      data: {
        id_tenant: 2n,
        nombre: 'Cuotas',
        tipo: 'INGRESO',
        activo: true,
      },
    });
    expect(result).toEqual({
      idTenant: 2,
      idCategoriaCaja: 15,
      nombre: 'Cuotas',
      tipo: 'INGRESO',
      activo: true,
    });
  });

  it('findAll lista con filtros tipo, activo y search', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findMany: jest.fn().mockResolvedValue([
          {
            id_tenant: 2n,
            id_categoria_caja: 20n,
            nombre: 'Cuotas comunales',
            tipo: 'INGRESO',
            activo: true,
          },
        ]),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.findAll(2n, 9n, {
      tipo: 'INGRESO',
      activo: true,
      search: ' cuota ',
    });

    expect(tx.caja_categorias.findMany).toHaveBeenCalledWith({
      where: {
        id_tenant: 2n,
        tipo: 'INGRESO',
        activo: true,
        OR: [{ nombre: { contains: 'cuota', mode: 'insensitive' } }],
      },
      orderBy: { id_categoria_caja: 'desc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].idCategoriaCaja).toBe(20);
  });

  it('findOne obtiene categoria por id', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_categoria_caja: 30n,
          nombre: 'Servicios',
          tipo: 'GASTO',
          activo: false,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.findOne(2n, 9n, 30n);

    expect(tx.caja_categorias.findUnique).toHaveBeenCalledWith({
      where: {
        id_tenant_id_categoria_caja: {
          id_tenant: 2n,
          id_categoria_caja: 30n,
        },
      },
    });
    expect(result.tipo).toBe('GASTO');
  });

  it('update actualiza categoria existente', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        update: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_categoria_caja: 30n,
          nombre: 'Servicios basicos',
          tipo: 'GASTO',
          activo: true,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.update(2n, 9n, 30n, {
      nombre: ' Servicios basicos ',
      activo: true,
    });

    expect(tx.caja_categorias.update).toHaveBeenCalledWith({
      where: {
        id_tenant_id_categoria_caja: {
          id_tenant: 2n,
          id_categoria_caja: 30n,
        },
      },
      data: {
        nombre: 'Servicios basicos',
        tipo: undefined,
        activo: true,
      },
    });
    expect(result.nombre).toBe('Servicios basicos');
  });

  it('remove borra fisicamente categoria sin movimientos relacionados', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await service.remove(2n, 9n, 40n);

    expect(tx.caja_categorias.delete).toHaveBeenCalledWith({
      where: {
        id_tenant_id_categoria_caja: {
          id_tenant: 2n,
          id_categoria_caja: 40n,
        },
      },
    });
  });

  it('remove traduce P2003 cuando la categoria tiene movimientos relacionados', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        delete: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('fk', {
            code: 'P2003',
            clientVersion: 'test',
          }),
        ),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.remove(2n, 9n, 40n)).rejects.toEqual(
      new ConflictException(
        'No se puede eliminar la categoria de caja porque tiene movimientos relacionados.',
      ),
    );
  });

  it('update traduce P2025 cuando la categoria no existe', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        update: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('missing', {
            code: 'P2025',
            clientVersion: 'test',
          }),
        ),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.update(2n, 9n, 50n, { nombre: 'Otra' })).rejects.toEqual(
      new NotFoundException('No se encontro la categoria de caja solicitada.'),
    );
  });

  it('rechaza acceso sin membresia activa', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      caja_categorias: {
        findMany: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.findAll(2n, 9n, {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.caja_categorias.findMany).not.toHaveBeenCalled();
  });
});
