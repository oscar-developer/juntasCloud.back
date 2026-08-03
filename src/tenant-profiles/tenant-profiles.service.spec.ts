import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantProfilesService } from './tenant-profiles.service';

describe('TenantProfilesService', () => {
  let service: TenantProfilesService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
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
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n, role: 'ADMIN' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenant_profiles: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tenant_profile_modules: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      app_modules: {
        findMany: jest.fn(),
      },
      ...overrides,
    };
  }

  it('create crea perfil con tenant context y nombre normalizado', async () => {
    const tx = baseTx();
    tx.tenant_profiles.create.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 10n,
      nombre: 'ADMIN',
      descripcion: 'Perfil admin',
      activo: true,
    });
    tx.tenant_profile_modules.findMany.mockResolvedValue([]);
    runWithTx(tx);

    const result = await service.create(2n, 9n, {
      nombre: ' ADMIN ',
      descripcion: ' Perfil admin ',
    });

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.tenant_users.findFirst).toHaveBeenCalledWith({
      where: { id_tenant: 2n, id_user: 9n, estado: 'ACTIVO' },
      select: { id_user: true, role: true, id_profile: true },
    });
    expect(tx.tenant_profiles.findFirst).toHaveBeenCalledWith({
      where: {
        id_tenant: 2n,
        nombre: 'ADMIN',
        id_profile: undefined,
      },
      select: { id_profile: true },
    });
    expect(tx.tenant_profiles.create).toHaveBeenCalledWith({
      data: {
        id_tenant: 2n,
        nombre: 'ADMIN',
        descripcion: 'Perfil admin',
        activo: true,
      },
    });
    expect(result).toEqual({
      idTenant: 2,
      idProfile: 10,
      nombre: 'ADMIN',
      descripcion: 'Perfil admin',
      activo: true,
      createdAt: null,
      updatedAt: null,
      totalModules: 0,
      totalAccess: 0,
      totalReadOnly: 0,
      totalNoAccess: 0,
      modules: [],
    });
  });

  it('create rechaza nombre duplicado', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findFirst.mockResolvedValue({ id_profile: 10n });
    runWithTx(tx);

    await expect(service.create(2n, 9n, { nombre: 'ADMIN' })).rejects.toEqual(
      new ConflictException('Ya existe un perfil con ese nombre en este tenant.'),
    );
    expect(tx.tenant_profiles.create).not.toHaveBeenCalled();
  });

  it('findAll lista perfiles del tenant', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findMany.mockResolvedValue([
      {
        id_tenant: 2n,
        id_profile: 12n,
        nombre: 'LECTOR',
        descripcion: null,
        activo: true,
        tenant_profile_modules: [
          { access_level: 'ACCESO_TOTAL' },
          { access_level: 'SOLO_LECTURA' },
        ],
      },
    ]);
    runWithTx(tx);

    const result = await service.findAll(2n, 9n);

    expect(tx.tenant_profiles.findMany).toHaveBeenCalledWith({
      where: {
        id_tenant: 2n,
        activo: undefined,
        OR: undefined,
      },
      include: {
        tenant_profile_modules: {
          select: { access_level: true },
        },
      },
      orderBy: { id_profile: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(result).toHaveLength(1);
    expect(result[0].idProfile).toBe(12);
    expect(result[0].totalAccess).toBe(1);
    expect(result[0].totalReadOnly).toBe(1);
  });

  it('findOne obtiene perfil por clave compuesta', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
        descripcion: null,
        activo: true,
      });
    tx.tenant_profile_modules.findMany.mockResolvedValue([
      {
        id_tenant: 2n,
        id_profile: 12n,
        module_code: 'dashboard',
        access_level: 'SOLO_LECTURA',
        app_modules: {
          module_code: 'dashboard',
          nombre: 'Dashboard',
          grupo: 'General',
          orden: 1,
          activo: true,
        },
      },
    ]);
    runWithTx(tx);

    const result = await service.findOne(2n, 9n, 12n);

    expect(tx.tenant_profiles.findUnique).toHaveBeenCalledWith({
      where: {
        id_tenant_id_profile: {
          id_tenant: 2n,
          id_profile: 12n,
        },
      },
    });
    expect(result.nombre).toBe('LECTOR');
    expect(result.modules).toEqual([
      {
        idTenant: 2,
        idProfile: 12,
        moduleCode: 'dashboard',
        nombre: 'Dashboard',
        grupo: 'General',
        orden: 1,
        activo: true,
        accessLevel: 'SOLO_LECTURA',
      },
    ]);
  });

  it('update actualiza perfil existente', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
      descripcion: null,
      activo: true,
    });
    tx.tenant_profiles.update.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR EDITADO',
      descripcion: 'Solo lectura',
      activo: false,
    });
    runWithTx(tx);

    const result = await service.update(2n, 9n, 12n, {
      nombre: ' LECTOR EDITADO ',
      descripcion: ' Solo lectura ',
      activo: false,
    });

    expect(tx.tenant_profiles.update).toHaveBeenCalledWith({
      where: {
        id_tenant_id_profile: {
          id_tenant: 2n,
          id_profile: 12n,
        },
      },
      data: {
        nombre: 'LECTOR EDITADO',
        descripcion: 'Solo lectura',
        activo: false,
      },
    });
    expect(result.activo).toBe(false);
  });

  it('remove rechaza eliminar perfil asignado a tenant_users', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
      descripcion: null,
      activo: true,
    });
    tx.tenant_users.findFirst
      .mockResolvedValueOnce({ id_user: 9n, role: 'ADMIN' })
      .mockResolvedValueOnce({ id_user: 20n });
    runWithTx(tx);

    await expect(service.remove(2n, 9n, 12n)).rejects.toEqual(
      new ConflictException(
        'No se puede eliminar el perfil porque esta asignado a usuarios del tenant.',
      ),
    );
    expect(tx.tenant_profile_modules.deleteMany).not.toHaveBeenCalled();
    expect(tx.tenant_profiles.delete).not.toHaveBeenCalled();
  });

  it('replaceModules reemplaza la configuracion completa', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'ADMIN',
      descripcion: null,
      activo: true,
    });
    tx.app_modules.findMany.mockResolvedValue([{ module_code: 'personas' }]);
    tx.tenant_profile_modules.findMany.mockResolvedValue([
      {
        id_tenant: 2n,
        id_profile: 12n,
        module_code: 'personas',
        access_level: 'ACCESO_TOTAL',
        app_modules: {
          module_code: 'personas',
          nombre: 'Personas',
          grupo: 'Padron',
          orden: 1,
          activo: true,
        },
      },
    ]);
    runWithTx(tx);

    const result = await service.replaceModules(2n, 9n, 12n, [
      { moduleCode: ' personas ', accessLevel: 'ACCESO_TOTAL' },
    ]);

    expect(tx.app_modules.findMany).toHaveBeenCalledWith({
      where: {
        module_code: { in: ['personas'] },
      },
      select: { module_code: true },
    });
    expect(tx.tenant_profile_modules.deleteMany).toHaveBeenCalledWith({
      where: { id_tenant: 2n, id_profile: 12n },
    });
    expect(tx.tenant_profile_modules.createMany).toHaveBeenCalledWith({
      data: [
        {
          id_tenant: 2n,
          id_profile: 12n,
          module_code: 'personas',
          access_level: 'ACCESO_TOTAL',
        },
      ],
    });
    expect(result[0]).toEqual({
      idTenant: 2,
      idProfile: 12,
      moduleCode: 'personas',
      nombre: 'Personas',
      grupo: 'Padron',
      orden: 1,
      activo: true,
      accessLevel: 'ACCESO_TOTAL',
    });
  });

  it('replaceModules rechaza moduleCode duplicado', async () => {
    await expect(
      service.replaceModules(2n, 9n, 12n, [
        { moduleCode: 'personas', accessLevel: 'ACCESO_TOTAL' },
        { moduleCode: 'personas', accessLevel: 'SOLO_LECTURA' },
      ]),
    ).rejects.toEqual(
      new BadRequestException('No se permiten moduleCode duplicados: personas.'),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('replaceModules rechaza modulo inexistente', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'ADMIN',
      descripcion: null,
      activo: true,
    });
    tx.app_modules.findMany.mockResolvedValue([]);
    runWithTx(tx);

    await expect(
      service.replaceModules(2n, 9n, 12n, [
        { moduleCode: 'personas', accessLevel: 'ACCESO_TOTAL' },
      ]),
    ).rejects.toEqual(
      new BadRequestException('Los siguientes moduleCode no existen: personas.'),
    );
  });

  it('replaceModules rechaza accessLevel invalido', async () => {
    await expect(
      service.replaceModules(2n, 9n, 12n, [
        { moduleCode: 'personas', accessLevel: 'NINGUNO' as 'SIN_ACCESO' },
      ]),
    ).rejects.toEqual(new BadRequestException('accessLevel invalido: NINGUNO.'));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updateUserProfile asigna perfil a usuario activo del tenant', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
      descripcion: null,
      activo: true,
    });
    tx.tenant_users.findUnique.mockResolvedValue({
      id_user: 20n,
      role: 'MEMBER',
      estado: 'ACTIVO',
    });
    runWithTx(tx);

    const result = await service.updateUserProfile(2n, 9n, 20n, 12n);

    expect(tx.tenant_users.update).toHaveBeenCalledWith({
      where: {
        id_tenant_id_user: {
          id_tenant: 2n,
          id_user: 20n,
        },
      },
      data: { id_profile: 12n },
    });
    expect(result.idProfile).toBe(12);
  });

  it('updateUserProfile rechaza usuario destino OWNER', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
      descripcion: null,
      activo: true,
    });
    tx.tenant_users.findUnique.mockResolvedValue({
      id_user: 20n,
      role: 'OWNER',
      estado: 'ACTIVO',
    });
    runWithTx(tx);

    await expect(service.updateUserProfile(2n, 9n, 20n, 12n)).rejects.toEqual(
      new ForbiddenException('No se puede cambiar el perfil de un usuario OWNER.'),
    );
    expect(tx.tenant_users.update).not.toHaveBeenCalled();
  });

  it('rechaza operaciones para actor sin rol OWNER o ADMIN', async () => {
    const tx = baseTx();
    tx.tenant_users.findFirst.mockResolvedValue({
      id_user: 9n,
      role: 'MEMBER',
      id_profile: null,
    });
    runWithTx(tx);

    await expect(service.findAll(2n, 9n)).rejects.toEqual(
      new ForbiddenException('No tiene permisos suficientes para esta operacion.'),
    );
  });

  it('permite administrar perfiles con ACCESO_TOTAL sobre admin_roles', async () => {
    const tx = baseTx();
    tx.tenant_users.findFirst.mockResolvedValue({
      id_user: 9n,
      role: 'MEMBER',
      id_profile: 30n,
    });
    tx.tenant_profile_modules.findUnique.mockResolvedValue({
      access_level: 'ACCESO_TOTAL',
    });
    tx.tenant_profiles.findMany.mockResolvedValue([]);
    runWithTx(tx);

    await expect(service.findAll(2n, 9n)).resolves.toEqual([]);
    expect(tx.tenant_profile_modules.findUnique).toHaveBeenCalledWith({
      where: {
        id_tenant_id_profile_module_code: {
          id_tenant: 2n,
          id_profile: 30n,
          module_code: 'admin_roles',
        },
      },
      select: { access_level: true },
    });
  });

  it('traduce P2025 en updates', async () => {
    const tx = baseTx();
    tx.tenant_profiles.findUnique.mockResolvedValue({
      id_tenant: 2n,
      id_profile: 12n,
      nombre: 'LECTOR',
      descripcion: null,
      activo: true,
    });
    tx.tenant_profiles.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('missing', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    runWithTx(tx);

    await expect(service.update(2n, 9n, 12n, { activo: false })).rejects.toEqual(
      new NotFoundException('No se encontro el registro solicitado.'),
    );
  });
});
