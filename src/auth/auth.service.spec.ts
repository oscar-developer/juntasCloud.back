import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    auth_users: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    auth_user_tokens: {
      updateMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    $executeRaw: jest.Mock;
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let mailService: {
    sendEmailVerification: jest.Mock;
    sendPasswordReset: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      auth_users: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      auth_user_tokens: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $transaction: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    mailService = {
      sendEmailVerification: jest.fn(),
      sendPasswordReset: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as never,
      mailService as unknown as MailService,
    );
  });

  it('bloquea login cuando el email no esta verificado y registra log', async () => {
    const passwordHash = await hash('Secreta123', 10);

    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 7n,
      email: 'user@test.com',
      nombres: 'Test',
      apellidos: 'User',
      email_verified: false,
      password_hash: passwordHash,
      estado: 'ACTIVO',
    });
    prisma.$executeRaw.mockResolvedValue(1);

    await expect(
      service.login(
        {
          email: 'user@test.com',
          password: 'Secreta123',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('login normaliza password y registra acceso exitoso', async () => {
    const passwordHash = await hash('Secreta123', 10);

    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 12n,
      email: 'user@test.com',
      nombres: 'Test',
      apellidos: 'User',
      email_verified: true,
      password_hash: passwordHash,
      estado: 'ACTIVO',
    });
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const tx = {
      auth_users: {
        update: jest.fn().mockResolvedValue({ id_user: 12n }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.login(
      {
        email: ' user@test.com ',
        password: ' Secreta123 ',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(response.accessToken).toBe('jwt-token');
    expect(prisma.auth_users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'user@test.com' },
      }),
    );
    expect(tx.auth_users.update).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('registra usuario, genera token hash y envia correo de verificacion', async () => {
    prisma.auth_users.findUnique.mockResolvedValue(null);
    mailService.sendEmailVerification.mockResolvedValue(undefined);

    const tx = {
      auth_users: {
        create: jest
          .fn()
          .mockResolvedValue({ id_user: 11n, email: 'new@test.com' }),
      },
      auth_user_tokens: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id_token: 100n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.register(
      {
        email: 'new@test.com',
        password: 'Password123',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(response.message).toBe(
      'Te enviamos un correo para verificar tu cuenta.',
    );
    expect(tx.auth_users.create).toHaveBeenCalledTimes(1);
    expect(tx.auth_user_tokens.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { revoked_at: expect.any(Date) },
        where: expect.objectContaining({
          revoked_at: null,
          used_at: null,
        }),
      }),
    );
    expect(tx.auth_user_tokens.create).toHaveBeenCalledTimes(1);
    expect(mailService.sendEmailVerification).toHaveBeenCalledTimes(1);

    const sentToken = mailService.sendEmailVerification.mock.calls[0][0]
      .token as string;
    const savedTokenHash = tx.auth_user_tokens.create.mock.calls[0][0].data
      .token_hash as string;
    expect(savedTokenHash).toBe(
      createHash('sha256').update(sentToken).digest('hex'),
    );
  });

  it('verifica correo con token valido', async () => {
    const token = 'token_valido';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60_000);

    const tx = {
      auth_user_tokens: {
        findFirst: jest.fn().mockResolvedValue({
          id_token: 21n,
          id_user: 8n,
          expires_at: expiresAt,
          used_at: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auth_users: {
        update: jest.fn().mockResolvedValue({ id_user: 8n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.verifyEmail({ token });

    expect(response.message).toBe('Correo verificado correctamente.');
    expect(tx.auth_user_tokens.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token_hash: tokenHash,
          token_type: 'VERIFY_EMAIL',
          revoked_at: null,
        }),
      }),
    );
    expect(tx.auth_user_tokens.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { revoked_at: expect.any(Date) },
        where: expect.objectContaining({
          id_user: 8n,
          revoked_at: null,
          used_at: null,
        }),
      }),
    );
    expect(tx.auth_users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_user: 8n },
        data: expect.objectContaining({
          email_verified: true,
        }),
      }),
    );
  });

  it('verify-email rechaza token revocado', async () => {
    const tx = {
      auth_user_tokens: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.verifyEmail({ token: 'token_revocado' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde mensaje generico cuando se reenvia verificacion para correo inexistente', async () => {
    prisma.auth_users.findUnique.mockResolvedValue(null);

    const response = await service.resendVerification(
      { email: 'missing@test.com' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(response.message).toBe(
      'Si el correo existe, enviaremos instrucciones.',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mailService.sendEmailVerification).not.toHaveBeenCalled();
  });

  it('reenvia verificacion cuando usuario existe y no esta verificado', async () => {
    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 30n,
      email: 'pending@test.com',
      email_verified: false,
    });
    mailService.sendEmailVerification.mockResolvedValue(undefined);

    const tx = {
      auth_user_tokens: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id_token: 31n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.resendVerification(
      { email: 'pending@test.com' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(response.message).toBe(
      'Si el correo existe, enviaremos instrucciones.',
    );
    expect(tx.auth_user_tokens.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.auth_user_tokens.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { revoked_at: expect.any(Date) },
        where: expect.objectContaining({
          revoked_at: null,
          used_at: null,
        }),
      }),
    );
    expect(tx.auth_user_tokens.create).toHaveBeenCalledTimes(1);
    expect(mailService.sendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it('forgot-password responde generico cuando correo no existe', async () => {
    prisma.auth_users.findUnique.mockResolvedValue(null);

    const response = await service.forgotPassword(
      { email: 'missing@test.com' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(response.message).toBe(
      'Si el correo existe, enviaremos instrucciones para recuperar tu contrasena.',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('forgot-password crea token RESET_PASSWORD y envia correo', async () => {
    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 50n,
      email: 'reset@test.com',
    });
    mailService.sendPasswordReset.mockResolvedValue(undefined);

    const tx = {
      auth_user_tokens: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id_token: 41n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.forgotPassword(
      { email: 'reset@test.com' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(response.message).toBe(
      'Si el correo existe, enviaremos instrucciones para recuperar tu contrasena.',
    );
    expect(tx.auth_user_tokens.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.auth_user_tokens.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { revoked_at: expect.any(Date) },
        where: expect.objectContaining({
          revoked_at: null,
          used_at: null,
        }),
      }),
    );
    expect(tx.auth_user_tokens.create).toHaveBeenCalledTimes(1);
    expect(tx.auth_user_tokens.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token_type: 'RESET_PASSWORD',
        }),
      }),
    );
    expect(mailService.sendPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('reset-password actualiza hash de contrasena con token valido', async () => {
    const token = 'reset_token_valido';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60_000);

    const tx = {
      auth_user_tokens: {
        findFirst: jest.fn().mockResolvedValue({
          id_token: 91n,
          id_user: 77n,
          expires_at: expiresAt,
          used_at: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auth_users: {
        update: jest.fn().mockResolvedValue({ id_user: 77n }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const response = await service.resetPassword({
      token,
      newPassword: 'NuevaClaveSegura2026',
    });

    expect(response.message).toBe('Contrasena actualizada correctamente.');
    expect(tx.auth_user_tokens.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token_hash: tokenHash,
          token_type: 'RESET_PASSWORD',
          revoked_at: null,
        }),
      }),
    );
    expect(tx.auth_user_tokens.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { revoked_at: expect.any(Date) },
        where: expect.objectContaining({
          id_user: 77n,
          revoked_at: null,
          used_at: null,
        }),
      }),
    );
    expect(tx.auth_users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_user: 77n },
        data: expect.objectContaining({
          password_hash: expect.any(String),
        }),
      }),
    );
  });

  it('reset-password rechaza token revocado', async () => {
    const tx = {
      auth_user_tokens: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.resetPassword({
        token: 'token_revocado',
        newPassword: 'NuevaClaveSegura2026',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('change-password actualiza hash cuando la password actual es valida', async () => {
    const currentHash = await hash('Actual123', 10);
    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 88n,
      password_hash: currentHash,
    });
    prisma.auth_users.update.mockResolvedValue({ id_user: 88n });

    const response = await service.changePassword(88n, {
      currentPassword: 'Actual123',
      newPassword: 'NuevaSegura456',
    });

    expect(response.message).toBe('Contrasena actualizada correctamente.');
    expect(prisma.auth_users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_user: 88n },
        data: expect.objectContaining({
          password_hash: expect.any(String),
        }),
      }),
    );
  });

  it('change-password falla cuando la password actual es incorrecta', async () => {
    const currentHash = await hash('Actual123', 10);
    prisma.auth_users.findUnique.mockResolvedValue({
      id_user: 99n,
      password_hash: currentHash,
    });

    await expect(
      service.changePassword(99n, {
        currentPassword: 'Incorrecta999',
        newPassword: 'NuevaSegura456',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.auth_users.update).not.toHaveBeenCalled();
  });
});
