import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantProfilesService } from './tenant-profiles.service';

describe('TenantProfilesService', () => {
  let service: TenantProfilesService;
  let prisma: { $transaction: jest.Mock; withTenantContext: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withTenantContext: jest.fn((_userId, _tenantId, fn) => prisma.$transaction(fn)),
    };
    service = new TenantProfilesService(prisma as unknown as PrismaService);
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
        update: jest.fn(),
      },
      tenant_profiles: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_profile: 10n,
          nombre: 'ADMIN',
          descripcion: 'Perfil admin',
          estado: true,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_profile: 10n,
          nombre: 'ADMIN',
          descripcion: 'Perfil admin',
          estado: true,
        }),
        update: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_profile: 10n,
          nombre: 'ADMIN',
          descripcion: null,
          estado: false,
        }),
      },
      tenant_profile_modules: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      app_modules: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      ...overrides,
    };
  }

  it('create traduce activo a estado en tenant_profiles', async () => {
    const tx = baseTx();
    runWithTx(tx);

    const result = await service.create(2n, 9n, {
      nombre: ' ADMIN ',
      descripcion: 'Perfil admin',
      activo: true,
    });

    expect(tx.tenant_profiles.create).toHaveBeenCalledWith({
      data: {
        id_tenant: 2n,
        nombre: 'ADMIN',
        descripcion: 'Perfil admin',
        estado: true,
      },
    });
    expect(result.activo).toBe(true);
  });

  it('replaceModules usa tenant_profile_modules sin id_tenant', async () => {
    const tx = baseTx();
    tx.tenant_profile_modules.findMany.mockResolvedValue([
      {
        id_profile: 10n,
        module_code: 'dashboard',
        access_level: 'SOLO_LECTURA',
        app_modules: {
          module_code: 'dashboard',
          nombre: 'Dashboard',
          grupo: 'General',
          orden: 1,
          estado: true,
        },
      },
    ]);
    tx.app_modules.findMany.mockResolvedValue([{ module_code: 'dashboard' }]);
    runWithTx(tx);

    const result = await service.replaceModules(2n, 9n, 10n, [
      { moduleCode: 'dashboard', accessLevel: 'SOLO_LECTURA' },
    ]);

    expect(tx.tenant_profile_modules.deleteMany).toHaveBeenCalledWith({
      where: { id_profile: 10n },
    });
    expect(tx.tenant_profile_modules.createMany).toHaveBeenCalledWith({
      data: [
        {
          id_profile: 10n,
          module_code: 'dashboard',
          access_level: 'SOLO_LECTURA',
        },
      ],
    });
    expect(result[0]).toEqual({
      idTenant: 2,
      idProfile: 10,
      moduleCode: 'dashboard',
      nombre: 'Dashboard',
      grupo: 'General',
      orden: 1,
      activo: true,
      accessLevel: 'SOLO_LECTURA',
    });
  });

  it('permite perfil con ACCESO_TOTAL sobre admin_roles usando PK v4', async () => {
    const tx = baseTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({
          id_user: 9n,
          role: 'MEMBER',
          id_profile: 30n,
        }),
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

  it('rechaza MEMBER sin permiso administrativo', async () => {
    const tx = baseTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({
          id_user: 9n,
          role: 'MEMBER',
          id_profile: null,
        }),
      },
    });
    runWithTx(tx);

    await expect(service.findAll(2n, 9n)).rejects.toEqual(
      new ForbiddenException('No tiene permisos suficientes para esta operacion.'),
    );
  });
});
