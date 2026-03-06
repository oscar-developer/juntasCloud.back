import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantInvitationsService } from './tenant-invitations.service';

describe('TenantInvitationsService', () => {
  let service: TenantInvitationsService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new TenantInvitationsService(prisma as unknown as PrismaService);
  });

  it('listMine retorna historial completo y ordenado con estado efectivo EXPIRED', async () => {
    const now = Date.now();
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auth_users: {
        findUnique: jest.fn().mockResolvedValue({
          id_user: 1n,
          email: 'me@test.com',
        }),
      },
      tenant_invitations: {
        findMany: jest.fn().mockResolvedValue([
          {
            id_invitation: 1n,
            id_tenant: 100n,
            email: 'me@test.com',
            role: 'MEMBER',
            status: 'ACCEPTED',
            expires_at: new Date(now - 10_000),
            invited_by: 9n,
            created_at: new Date(now - 500_000),
          },
          {
            id_invitation: 2n,
            id_tenant: 100n,
            email: 'me@test.com',
            role: 'MEMBER',
            status: 'PENDING',
            expires_at: new Date(now + 10_000),
            invited_by: 9n,
            created_at: new Date(now - 200_000),
          },
          {
            id_invitation: 3n,
            id_tenant: 100n,
            email: 'me@test.com',
            role: 'MEMBER',
            status: 'REVOKED',
            expires_at: new Date(now + 10_000),
            invited_by: 9n,
            created_at: new Date(now - 10_000),
          },
          {
            id_invitation: 4n,
            id_tenant: 100n,
            email: 'me@test.com',
            role: 'MEMBER',
            status: 'PENDING',
            expires_at: new Date(now - 5_000),
            invited_by: 9n,
            created_at: new Date(now - 1_000),
          },
          {
            id_invitation: 5n,
            id_tenant: 100n,
            email: 'me@test.com',
            role: 'MEMBER',
            status: 'PENDING',
            expires_at: new Date(now + 10_000),
            invited_by: 9n,
            created_at: new Date(now - 50_000),
          },
        ]),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.listMine(1n);

    expect(tx.tenant_invitations.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'me@test.com' },
      }),
    );
    expect(result.map((x) => x.idInvitation)).toEqual([5, 2, 1, 3, 4]);
    expect(result.map((x) => x.status)).toEqual([
      'PENDING',
      'PENDING',
      'ACCEPTED',
      'REVOKED',
      'EXPIRED',
    ]);
  });

  it('listSentMine lista invitaciones por invited_by y aplica estado efectivo', async () => {
    const now = Date.now();
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_invitations: {
        findMany: jest.fn().mockResolvedValue([
          {
            id_invitation: 10n,
            id_tenant: 300n,
            email: 'user1@test.com',
            role: 'MEMBER',
            status: 'PENDING',
            expires_at: new Date(now - 5_000),
            invited_by: 7n,
            created_at: new Date(now - 100_000),
          },
          {
            id_invitation: 11n,
            id_tenant: 301n,
            email: 'user2@test.com',
            role: 'ADMIN',
            status: 'ACCEPTED',
            expires_at: new Date(now - 5_000),
            invited_by: 7n,
            created_at: new Date(now - 10_000),
          },
        ]),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.listSentMine(7n);

    expect(tx.tenant_invitations.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { invited_by: 7n },
      }),
    );
    expect(result.map((x) => x.status)).toEqual(['ACCEPTED', 'EXPIRED']);
  });

  it('accept falla cuando la invitacion esta expirada', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auth_users: {
        findUnique: jest.fn().mockResolvedValue({
          id_user: 5n,
          email: 'me@test.com',
        }),
      },
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue({
          id_invitation: 15n,
          id_tenant: 99n,
          email: 'me@test.com',
          role: 'MEMBER',
          status: 'PENDING',
          expires_at: new Date(Date.now() - 1_000),
          invited_by: 2n,
          created_at: new Date(Date.now() - 60_000),
        }),
        update: jest.fn(),
      },
      tenant_users: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.accept(15n, 5n)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.tenant_users.findFirst).not.toHaveBeenCalled();
    expect(tx.tenant_users.create).not.toHaveBeenCalled();
    expect(tx.tenant_invitations.update).not.toHaveBeenCalled();
  });

  it('reject falla cuando la invitacion esta expirada', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auth_users: {
        findUnique: jest.fn().mockResolvedValue({
          id_user: 6n,
          email: 'me@test.com',
        }),
      },
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue({
          id_invitation: 18n,
          id_tenant: 110n,
          email: 'me@test.com',
          role: 'MEMBER',
          status: 'PENDING',
          expires_at: new Date(Date.now() - 5_000),
          invited_by: 2n,
          created_at: new Date(Date.now() - 60_000),
        }),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.reject(18n, 6n)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.tenant_invitations.update).not.toHaveBeenCalled();
  });

  it('accept mantiene validacion de pertenencia por email', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auth_users: {
        findUnique: jest.fn().mockResolvedValue({
          id_user: 7n,
          email: 'me@test.com',
        }),
      },
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue({
          id_invitation: 20n,
          id_tenant: 110n,
          email: 'other@test.com',
          role: 'MEMBER',
          status: 'PENDING',
          expires_at: new Date(Date.now() + 60_000),
          invited_by: 2n,
          created_at: new Date(Date.now() - 60_000),
        }),
      },
      tenant_users: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.accept(20n, 7n)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.tenant_users.findFirst).not.toHaveBeenCalled();
  });

  it('reject mantiene validacion de pertenencia por email', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auth_users: {
        findUnique: jest.fn().mockResolvedValue({
          id_user: 8n,
          email: 'me@test.com',
        }),
      },
      tenant_invitations: {
        findUnique: jest.fn().mockResolvedValue({
          id_invitation: 21n,
          id_tenant: 111n,
          email: 'other@test.com',
          role: 'MEMBER',
          status: 'PENDING',
          expires_at: new Date(Date.now() + 60_000),
          invited_by: 2n,
          created_at: new Date(Date.now() - 60_000),
        }),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(service.reject(21n, 8n)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.tenant_invitations.update).not.toHaveBeenCalled();
  });
});
