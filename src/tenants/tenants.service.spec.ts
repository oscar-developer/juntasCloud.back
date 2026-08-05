import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new TenantsService(prisma as unknown as PrismaService);
  });

  function runWithTx(tx: Record<string, unknown>) {
    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );
  }

  function tenant(overrides: Record<string, unknown> = {}) {
    return {
      id_tenant: 2n,
      nombre: 'Junta',
      tipo_documento: null,
      numero_documento: null,
      estado: 'ACTIVO',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      observaciones: null,
      tenant_users: [{ id_user: 77n }],
      ...overrides,
    };
  }

  function baseTx(overrides: Record<string, unknown> = {}) {
    return {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ id_tenant: 2n }]),
      tenants: {
        findUnique: jest.fn().mockResolvedValue(tenant()),
        findMany: jest.fn().mockResolvedValue([tenant()]),
        update: jest.fn().mockResolvedValue(tenant({ nombre: 'Nueva Junta' })),
      },
      ...overrides,
    };
  }

  it('create llama public.create_tenant y deriva ownerUserId desde tenant_users', async () => {
    const tx = baseTx();
    runWithTx(tx);

    const result = await service.create(
      { nombre: ' Junta ', observaciones: ' Demo ' },
      77n,
    );

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.tenants.findUnique).toHaveBeenCalledWith({
      select: expect.objectContaining({
        tenant_users: expect.objectContaining({
          where: { role: 'OWNER', estado: 'ACTIVO' },
        }),
      }),
      where: { id_tenant: 2n },
    });
    expect(result.ownerUserId).toBe(77);
  });

  it('findAll expone ownerUserId derivado por tenant', async () => {
    const tx = baseTx();
    runWithTx(tx);

    const result = await service.findAll({}, 77n);

    expect(tx.tenants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ tenant_users: expect.any(Object) }),
      }),
    );
    expect(result[0].ownerUserId).toBe(77);
  });

  it('update permite estado SUSPENDIDO y usa contexto tenant', async () => {
    const tx = baseTx();
    runWithTx(tx);

    const result = await service.update(2n, { estado: 'SUSPENDIDO' }, 77n);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.tenants.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenant: 2n },
        data: expect.objectContaining({ estado: 'SUSPENDIDO' }),
      }),
    );
    expect(result.nombre).toBe('Nueva Junta');
  });

  it('remove usa funcion v4 para enviar tenant a papelera', async () => {
    const tx = baseTx({ $queryRaw: jest.fn().mockResolvedValue([{ ok: true }]) });
    runWithTx(tx);

    await service.remove(2n, 77n);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('removePermanent traduce errores OWNER de la funcion SQL', async () => {
    const tx = baseTx({
      $queryRaw: jest.fn().mockRejectedValue(new Error('Solamente el OWNER puede eliminar')),
    });
    runWithTx(tx);

    await expect(service.removePermanent(2n, 77n)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
