import { PrismaService } from './prisma.service';

describe('PrismaService context helpers', () => {
  function serviceWithTransaction(tx: { $executeRaw: jest.Mock }) {
    const service = Object.create(PrismaService.prototype) as PrismaService & {
      $transaction: jest.Mock;
    };
    service.$transaction = jest.fn(async (fn: (txClient: typeof tx) => Promise<unknown>) =>
      fn(tx),
    );
    return service;
  }

  it('withUserContext setea app.user_id dentro de una transaccion', async () => {
    const tx = { $executeRaw: jest.fn().mockResolvedValue(1) };
    const service = serviceWithTransaction(tx);
    const callback = jest.fn().mockResolvedValue('ok');

    await expect(service.withUserContext(7n, callback)).resolves.toBe('ok');

    expect(service.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(tx);
  });

  it('withTenantContext setea app.user_id y app.tenant_id dentro de una transaccion', async () => {
    const tx = { $executeRaw: jest.fn().mockResolvedValue(1) };
    const service = serviceWithTransaction(tx);
    const callback = jest.fn().mockResolvedValue('ok');

    await expect(service.withTenantContext(7n, 3n, callback)).resolves.toBe('ok');

    expect(service.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(tx);
  });
});
