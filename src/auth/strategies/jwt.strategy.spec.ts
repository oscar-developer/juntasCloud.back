import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: {
    auth_users: {
      findUnique: jest.Mock;
    };
  };
  const previousSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    prisma = {
      auth_users: {
        findUnique: jest.fn(),
      },
    };
    strategy = new JwtStrategy(prisma as unknown as PrismaService);
  });

  afterAll(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  it('acepta usuario activo y verificado', async () => {
    prisma.auth_users.findUnique.mockResolvedValue({
      email: 'me@test.com',
      estado: 'ACTIVO',
      email_verified: true,
    });

    await expect(strategy.validate({ sub: 1 })).resolves.toEqual({
      userId: 1,
      email: 'me@test.com',
    });
  });

  it('rechaza usuario bloqueado', async () => {
    prisma.auth_users.findUnique.mockResolvedValue({
      email: 'me@test.com',
      estado: 'BLOQUEADO',
      email_verified: true,
    });

    await expect(strategy.validate({ sub: 1 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza usuario sin correo verificado', async () => {
    prisma.auth_users.findUnique.mockResolvedValue({
      email: 'me@test.com',
      estado: 'ACTIVO',
      email_verified: false,
    });

    await expect(strategy.validate({ sub: 1 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
