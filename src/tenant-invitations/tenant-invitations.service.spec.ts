import { ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantInvitationsService } from './tenant-invitations.service';

describe('TenantInvitationsService', () => {
  let service: TenantInvitationsService;
  let prisma: {
    $transaction: jest.Mock;
    withUserContext: jest.Mock;
    withTenantContext: jest.Mock;
  };
  let mailService: { sendTenantInvitation: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withUserContext: jest.fn((_userId, fn) =>
        prisma.$transaction(async (tx) => {
          await tx.$executeRaw?.();
          return fn(tx);
        }),
      ),
      withTenantContext: jest.fn((_userId, _tenantId, fn) =>
        prisma.$transaction(async (tx) => {
          await tx.$executeRaw?.();
          await tx.$executeRaw?.();
          return fn(tx);
        }),
      ),
    };
    mailService = { sendTenantInvitation: jest.fn().mockResolvedValue(undefined) };
    service = new TenantInvitationsService(
      prisma as unknown as PrismaService,
      mailService as unknown as MailService,
    );
  });

  function runWithTx(tx: Record<string, unknown>) {
    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );
  }

  function invitation(overrides: Record<string, unknown> = {}) {
    return {
      id_invitation: 10n,
      id_tenant: 2n,
      email: 'nuevo@test.com',
      role: 'MEMBER',
      id_profile: null,
      status: 'PENDING',
      expires_at: new Date(Date.now() + 60_000),
      accepted_at: null,
      rejected_at: null,
      revoked_at: null,
      invited_by: 9n,
      message: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  function baseTx(overrides: Record<string, unknown> = {}) {
    return {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ token: 'plain-token' }]),
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue(invitation()),
        findMany: jest.fn().mockResolvedValue([]),
      },
      ...overrides,
    };
  }

  it('create usa public.create_tenant_invitation y envia token en claro por correo', async () => {
    const tx = baseTx();
    runWithTx(tx);

    const result = await service.create(2n, 9n, {
      email: ' NUEVO@test.com ',
      role: 'MEMBER',
      expiresInDays: 7,
    });

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.tenant_invitations.findUnique).toHaveBeenCalledWith({
      where: {
        token_hash: createHash('sha256').update('plain-token').digest('hex'),
      },
    });
    expect(mailService.sendTenantInvitation).toHaveBeenCalledWith({
      email: 'nuevo@test.com',
      token: 'plain-token',
      expiresInDays: 7,
    });
    expect(result.status).toBe('PENDING');
  });

  it('accept procesa por token y no crea tenant_users manualmente', async () => {
    const token = 'accepted-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tx = baseTx({
      $queryRaw: jest.fn().mockResolvedValue([{ id_tenant: 2n }]),
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue(
          invitation({
            status: 'ACCEPTED',
            accepted_at: new Date('2026-01-02T00:00:00.000Z'),
          }),
        ),
      },
    });
    runWithTx(tx);

    const result = await service.accept(token, 5n);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.tenant_invitations.findUnique).toHaveBeenCalledWith({
      where: { token_hash: tokenHash },
    });
    expect((tx as { tenant_users?: unknown }).tenant_users).toBeUndefined();
    expect(result.status).toBe('ACCEPTED');
  });

  it('reject procesa por token y devuelve estado REJECTED', async () => {
    const tx = baseTx({
      $queryRaw: jest.fn().mockResolvedValue([{ ok: true }]),
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue(
          invitation({
            status: 'REJECTED',
            rejected_at: new Date('2026-01-02T00:00:00.000Z'),
          }),
        ),
      },
    });
    runWithTx(tx);

    const result = await service.reject('reject-token', 5n);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectedAt).toBeInstanceOf(Date);
  });

  it('traduce error de correo ajeno a ForbiddenException', async () => {
    const tx = baseTx({
      $queryRaw: jest
        .fn()
        .mockRejectedValue(new Error('La invitación corresponde a otro correo electrónico')),
    });
    runWithTx(tx);

    await expect(service.accept('token', 5n)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
