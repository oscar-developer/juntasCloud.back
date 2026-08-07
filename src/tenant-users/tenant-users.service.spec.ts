import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantUsersService } from './tenant-users.service';

describe('TenantUsersService', () => {
  let service: TenantUsersService;
  let prisma: { $transaction: jest.Mock; withTenantContext: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withTenantContext: jest.fn((_userId, _tenantId, fn) => prisma.$transaction(fn)),
    };
    service = new TenantUsersService(prisma as unknown as PrismaService);
  });

  function runWithTx(tx: Record<string, unknown>) {
    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );
  }

  function baseTx(overrides: Record<string, unknown> = {}) {
    return {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({
          id_user: 9n,
          role: 'ADMIN',
          id_profile: null,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      tenant_profile_modules: {
        findUnique: jest.fn(),
      },
      ...overrides,
    };
  }

  it('findAll lista miembros activos sin acceptedAt', async () => {
    const joinedAt = new Date('2026-01-02T03:04:05.000Z');
    const tx = baseTx();
    tx.tenant_users.findMany.mockResolvedValue([
      {
        id_tenant: 2n,
        id_user: 20n,
        role: 'MEMBER',
        estado: 'ACTIVO',
        joined_at: joinedAt,
        ended_at: null,
        invited_by: 9n,
        id_persona: 30n,
        id_profile: 40n,
        auth_users_tenant_users_id_userToauth_users: {
          nombres: 'Maria',
          apellidos: 'Rojas',
        },
      },
    ]);
    runWithTx(tx);

    const result = await service.findAll(2n, 9n);

    expect(tx.tenant_users.findMany).toHaveBeenCalledWith({
      where: { id_tenant: 2n, estado: 'ACTIVO', role: undefined },
      select: expect.not.objectContaining({ accepted_at: true }),
      orderBy: [{ role: 'asc' }, { joined_at: 'desc' }, { id_user: 'asc' }],
      skip: 0,
      take: 20,
    });
    expect(result).toEqual([
      {
        idTenant: 2,
        idUser: 20,
        role: 'MEMBER',
        estado: 'ACTIVO',
        joinedAt,
        endedAt: null,
        invitedBy: 9,
        idPersona: 30,
        idProfile: 40,
        nombres: 'Maria',
        apellidos: 'Rojas',
      },
    ]);
  });

  it('rechaza estados que no existen en tenant_users v4', async () => {
    await expect(
      service.findAll(2n, 9n, { estado: 'PENDIENTE' as 'ACTIVO' }),
    ).rejects.toEqual(new BadRequestException('estado solo admite ACTIVO, INACTIVO.'));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza MEMBER sin permiso administrativo', async () => {
    const tx = baseTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({
          id_user: 9n,
          role: 'MEMBER',
          id_profile: null,
        }),
        findMany: jest.fn(),
      },
    });
    runWithTx(tx);

    await expect(service.findAll(2n, 9n)).rejects.toEqual(
      new ForbiddenException('No tiene permisos suficientes para esta operacion.'),
    );
    expect(tx.tenant_users.findMany).not.toHaveBeenCalled();
  });

  it('permite perfil con ACCESO_TOTAL sobre admin_roles usando PK v4', async () => {
    const tx = baseTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({
          id_user: 9n,
          role: 'MEMBER',
          id_profile: 30n,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    tx.tenant_profile_modules.findUnique.mockResolvedValue({
      access_level: 'ACCESO_TOTAL',
    });
    runWithTx(tx);

    await expect(service.findAll(2n, 9n)).resolves.toEqual([]);
    expect(tx.tenant_profile_modules.findUnique).toHaveBeenCalledWith({
      where: {
        id_profile_module_code: {
          id_profile: 30n,
          module_code: 'admin_roles',
        },
      },
      select: { access_level: true },
    });
  });
});
