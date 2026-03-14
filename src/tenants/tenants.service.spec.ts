import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
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
    expect(result.ownerUserId).toBe(77);
    expect(result.idTenant).toBe(101);
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
});
