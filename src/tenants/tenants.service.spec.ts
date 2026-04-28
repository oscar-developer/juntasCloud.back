import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new TenantsService(prisma as unknown as PrismaService);
  });

  it('create guarda owner_user_id, crea membresia OWNER y responde ownerUserId', async () => {
    const createdAt = new Date('2026-03-14T12:00:00.000Z');
    const conceptosBase = [
      {
        id_concepto_cobro_base: 1n,
        nombre: 'Cuota ordinaria',
        tipo: 'CUOTA_ORDINARIA',
        activo: true,
        requiere_periodo: true,
        observaciones: 'Cobro periodico regular',
      },
      {
        id_concepto_cobro_base: 2n,
        nombre: 'Multa por faena',
        tipo: 'MULTA_FAENA',
        activo: false,
        requiere_periodo: false,
        observaciones: null,
      },
    ];
    const categoriasBase = [
      {
        id_categoria_caja_base: 10n,
        nombre: 'Cuotas',
        tipo: 'INGRESO',
        activo: true,
      },
      {
        id_categoria_caja_base: 11n,
        nombre: 'Servicios',
        tipo: 'GASTO',
        activo: false,
      },
    ];
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        create: jest.fn().mockResolvedValue({
          id_tenant: 101n,
          nombre: 'Junta Los Alamos',
          tipo_documento: 'RUC',
          numero_documento: '20123456789',
          estado: 'ACTIVO',
          created_at: createdAt,
          observaciones: 'Tenant creado desde API',
          owner_user_id: 77n,
        }),
      },
      tenant_users: {
        create: jest.fn().mockResolvedValue(undefined),
      },
      conceptos_cobro_base: {
        findMany: jest.fn().mockResolvedValue(conceptosBase),
      },
      conceptos_cobro: {
        createMany: jest.fn().mockResolvedValue({ count: conceptosBase.length }),
      },
      caja_categorias_base: {
        findMany: jest.fn().mockResolvedValue(categoriasBase),
      },
      caja_categorias: {
        createMany: jest.fn().mockResolvedValue({ count: categoriasBase.length }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.create(
      {
        nombre: ' Junta Los Alamos ',
        tipoDocumento: 'RUC',
        numeroDocumento: '20123456789',
        observaciones: 'Tenant creado desde API',
      },
      77n,
    );

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.tenants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nombre: 'Junta Los Alamos',
          owner_user_id: 77n,
          estado: 'ACTIVO',
        }),
      }),
    );
    expect(tx.tenant_users.create).toHaveBeenCalledWith({
      data: {
        id_tenant: 101n,
        id_user: 77n,
        role: 'OWNER',
        estado: 'ACTIVO',
        invited_by: null,
      },
    });

    const userContextQuery = tx.$executeRaw.mock.calls[0][0] as {
      strings: string[];
      values: string[];
    };
    expect(userContextQuery.strings.join('')).toContain("set_config('app.user_id'");
    expect(userContextQuery.values).toEqual(['77']);

    const tenantContextQuery = tx.$executeRaw.mock.calls[1][0] as {
      strings: string[];
      values: string[];
    };
    expect(tenantContextQuery.strings.join('')).toContain("set_config('app.tenant_id'");
    expect(tenantContextQuery.values).toEqual(['101']);

    expect(tx.conceptos_cobro_base.findMany).toHaveBeenCalledWith({
      orderBy: { id_concepto_cobro_base: 'asc' },
    });
    expect(tx.conceptos_cobro.createMany).toHaveBeenCalledWith({
      data: [
        {
          id_tenant: 101n,
          nombre: 'Cuota ordinaria',
          tipo: 'CUOTA_ORDINARIA',
          activo: true,
          requiere_periodo: true,
          observaciones: 'Cobro periodico regular',
        },
        {
          id_tenant: 101n,
          nombre: 'Multa por faena',
          tipo: 'MULTA_FAENA',
          activo: false,
          requiere_periodo: false,
          observaciones: null,
        },
      ],
    });

    expect(tx.caja_categorias_base.findMany).toHaveBeenCalledWith({
      orderBy: { id_categoria_caja_base: 'asc' },
    });
    expect(tx.caja_categorias.createMany).toHaveBeenCalledWith({
      data: [
        {
          id_tenant: 101n,
          nombre: 'Cuotas',
          tipo: 'INGRESO',
          activo: true,
        },
        {
          id_tenant: 101n,
          nombre: 'Servicios',
          tipo: 'GASTO',
          activo: false,
        },
      ],
    });

    expect(tx.tenant_users.create.mock.invocationCallOrder[0]).toBeLessThan(
      tx.$executeRaw.mock.invocationCallOrder[1],
    );
    expect(tx.$executeRaw.mock.invocationCallOrder[1]).toBeLessThan(
      tx.conceptos_cobro.createMany.mock.invocationCallOrder[0],
    );
    expect(tx.conceptos_cobro.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.caja_categorias.createMany.mock.invocationCallOrder[0],
    );

    expect(result.ownerUserId).toBe(77);
    expect(result.idTenant).toBe(101);
  });

  it('create rechaza si falla la siembra de conceptos y no continua con categorias', async () => {
    const seedError = new Error('fallo sembrando conceptos');
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        create: jest.fn().mockResolvedValue({
          id_tenant: 150n,
          nombre: 'Tenant con fallo',
          tipo_documento: null,
          numero_documento: null,
          estado: 'ACTIVO',
          created_at: new Date('2026-03-14T12:00:00.000Z'),
          observaciones: null,
          owner_user_id: 77n,
        }),
      },
      tenant_users: {
        create: jest.fn().mockResolvedValue(undefined),
      },
      conceptos_cobro_base: {
        findMany: jest.fn().mockResolvedValue([
          {
            id_concepto_cobro_base: 1n,
            nombre: 'Cuota ordinaria',
            tipo: 'CUOTA_ORDINARIA',
            activo: true,
            requiere_periodo: true,
            observaciones: null,
          },
        ]),
      },
      conceptos_cobro: {
        createMany: jest.fn().mockRejectedValue(seedError),
      },
      caja_categorias_base: {
        findMany: jest.fn().mockResolvedValue([
          {
            id_categoria_caja_base: 10n,
            nombre: 'Cuotas',
            tipo: 'INGRESO',
            activo: true,
          },
        ]),
      },
      caja_categorias: {
        createMany: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.create(
        {
          nombre: 'Tenant con fallo',
        },
        77n,
      ),
    ).rejects.toThrow(seedError);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.conceptos_cobro.createMany).toHaveBeenCalledTimes(1);
    expect(tx.caja_categorias.createMany).not.toHaveBeenCalled();
  });

  it('create traduce P2002 al nuevo conflicto por owner y nombre', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create(
        {
          nombre: 'Junta Los Alamos',
        },
        77n,
      ),
    ).rejects.toEqual(
      new ConflictException(
        'Ya existe un tenant con ese nombre para el owner actual.',
      ),
    );
  });

  it('findOne retorna ownerUserId desde tenants.owner_user_id', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 55n,
          nombre: 'Tenant lectura',
          tipo_documento: null,
          numero_documento: null,
          estado: 'ACTIVO',
          created_at: new Date('2026-03-14T13:00:00.000Z'),
          observaciones: null,
          owner_user_id: 9n,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.findOne(55n, 9n);

    expect(tx.tenants.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenant: 55n },
      }),
    );
    expect(result.ownerUserId).toBe(9);
  });

  it('findOne lanza NotFoundException cuando el tenant no existe', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.findOne(404n, 9n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update permite cambios cuando el JWT pertenece al owner del tenant', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 60n,
          owner_user_id: 9n,
        }),
        update: jest.fn().mockResolvedValue({
          id_tenant: 60n,
          nombre: 'Tenant actualizado',
          tipo_documento: null,
          numero_documento: null,
          estado: 'ACTIVO',
          created_at: new Date('2026-03-14T14:00:00.000Z'),
          observaciones: 'Actualizado',
          owner_user_id: 9n,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.update(
      60n,
      {
        nombre: 'Tenant actualizado',
        observaciones: 'Actualizado',
      },
      9n,
    );

    expect(tx.tenants.findUnique).toHaveBeenCalledWith({
      where: { id_tenant: 60n },
      select: {
        id_tenant: true,
        owner_user_id: true,
      },
    });
    expect(tx.tenants.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenant: 60n },
        data: expect.objectContaining({
          nombre: 'Tenant actualizado',
          observaciones: 'Actualizado',
        }),
      }),
    );
    expect(result.ownerUserId).toBe(9);
  });

  it('update rechaza con ForbiddenException cuando el usuario no es owner', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 61n,
          owner_user_id: 5n,
        }),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.update(
        61n,
        {
          nombre: 'No permitido',
        },
        9n,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.tenants.update).not.toHaveBeenCalled();
  });

  it('update retorna NotFoundException cuando el tenant no existe', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.update(
        404n,
        {
          nombre: 'Inexistente',
        },
        9n,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.tenants.update).not.toHaveBeenCalled();
  });

  it('remove permite soft delete cuando el JWT pertenece al owner del tenant', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 70n,
          owner_user_id: 9n,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await service.remove(70n, 9n);

    expect(tx.tenants.findUnique).toHaveBeenCalledWith({
      where: { id_tenant: 70n },
      select: {
        id_tenant: true,
        owner_user_id: true,
      },
    });
    expect(tx.tenants.update).toHaveBeenCalledWith({
      where: { id_tenant: 70n },
      data: {
        estado: 'INACTIVO',
        updated_at: expect.any(Date),
      },
    });
  });

  it('remove rechaza con ForbiddenException cuando el usuario no es owner', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 71n,
          owner_user_id: 5n,
        }),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.remove(71n, 9n)).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.tenants.update).not.toHaveBeenCalled();
  });

  it('remove retorna NotFoundException cuando el tenant no existe', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenants: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.remove(405n, 9n)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.tenants.update).not.toHaveBeenCalled();
  });

  it('removePermanent ejecuta fn_delete_tenant cuando el JWT pertenece al owner', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ fn_delete_tenant: null }]),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 80n,
          owner_user_id: 9n,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await service.removePermanent(80n, 9n);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.tenants.findUnique).toHaveBeenCalledWith({
      where: { id_tenant: 80n },
      select: {
        id_tenant: true,
        owner_user_id: true,
      },
    });
    expect(tx.$queryRaw).toHaveBeenCalledWith(
      Prisma.sql`SELECT fn_delete_tenant(${80n}, ${9n})`,
    );
  });

  it('removePermanent rechaza con ForbiddenException cuando el usuario no es owner', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn(),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 81n,
          owner_user_id: 5n,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.removePermanent(81n, 9n)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('removePermanent traduce el error OWNER de la funcion SQL', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError(
          'Solo el OWNER puede eliminar el tenant',
          { clientVersion: 'test' },
        ),
      ),
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 82n,
          owner_user_id: 9n,
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.removePermanent(82n, 9n)).rejects.toEqual(
      new ForbiddenException(
        'Solo el owner del tenant puede eliminarlo definitivamente.',
      ),
    );
  });
});
