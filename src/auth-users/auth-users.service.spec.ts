import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUsersService } from './auth-users.service';

describe('AuthUsersService', () => {
  let service: AuthUsersService;
  let prisma: {
    auth_users: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      auth_users: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AuthUsersService(prisma as unknown as PrismaService);
  });

  const user = {
    id_user: 1n,
    email: 'me@test.com',
    nombres: 'Nombre',
    apellidos: 'Apellido',
    estado: 'ACTIVO',
    email_verified: true,
    email_verified_at: new Date('2026-01-01T00:00:00.000Z'),
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    last_login_at: null,
  };

  it('findMe solo consulta el usuario autenticado', async () => {
    prisma.auth_users.findUnique.mockResolvedValue(user);

    const result = await service.findMe(1n);

    expect(prisma.auth_users.findUnique).toHaveBeenCalledWith({
      where: { id_user: 1n },
    });
    expect(result.email).toBe('me@test.com');
  });

  it('updateMe solo actualiza nombres y apellidos', async () => {
    prisma.auth_users.update.mockResolvedValue({
      ...user,
      nombres: 'Nuevo',
      apellidos: 'Nombre',
    });

    const result = await service.updateMe(1n, {
      nombres: ' Nuevo ',
      apellidos: ' Nombre ',
    });

    expect(prisma.auth_users.update).toHaveBeenCalledWith({
      where: { id_user: 1n },
      data: {
        nombres: 'Nuevo',
        apellidos: 'Nombre',
      },
    });
    expect(result.nombres).toBe('Nuevo');
  });

  it('updateMe rechaza payload vacio', async () => {
    await expect(service.updateMe(1n, {})).rejects.toEqual(
      new BadRequestException('Debe enviar al menos nombres o apellidos para actualizar.'),
    );
    expect(prisma.auth_users.update).not.toHaveBeenCalled();
  });
});
