import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PersonasService } from './personas.service';

describe('PersonasService', () => {
  let service: PersonasService;
  let prisma: {
    withTenantContext: jest.Mock;
  };

  const tenantId = 7n;
  const userId = 9n;

  beforeEach(() => {
    prisma = {
      withTenantContext: jest.fn((_userId, _tenantId, fn) => fn(createTx())),
    };
    service = new PersonasService(prisma as unknown as PrismaService);
  });

  function persona(overrides: Partial<ReturnType<typeof basePersona>> = {}) {
    return {
      ...basePersona(),
      ...overrides,
    };
  }

  function basePersona() {
    return {
      id_tenant: tenantId,
      id_persona: 12n,
      nro_padron: null,
      nombres: 'Juan',
      apellido_paterno: 'Perez',
      apellido_materno: 'Gomez',
      dni: '12345678',
      email: null,
      telefono: null,
      direccion: null,
      referencia_vivienda: null,
      tipo_participante: 'NO_PADRONADO',
      estado: 'ACTIVO',
      fecha_registro: new Date('2026-02-28T00:00:00.000Z'),
      fecha_baja: null,
      observaciones: null,
    };
  }

  function createTx(overrides: Record<string, unknown> = {}) {
    return {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: userId }),
      },
      personas: {
        aggregate: jest.fn().mockResolvedValue({ _max: { nro_padron: 24 } }),
        create: jest.fn().mockResolvedValue(
          persona({
            nro_padron: 25,
            tipo_participante: 'PADRONADO',
          }),
        ),
        findMany: jest.fn().mockResolvedValue([persona()]),
        findUnique: jest.fn().mockResolvedValue(persona()),
        update: jest.fn().mockResolvedValue(persona()),
        delete: jest.fn().mockResolvedValue(persona()),
      },
      persona_condiciones: {
        create: jest.fn().mockResolvedValue({ id_persona_condicion: 1n }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ...overrides,
    };
  }

  it('crea persona PADRONADO con estado ACTIVO, fechaBaja null y nroPadron autogenerado', async () => {
    const tx = createTx();
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    const result = await service.create(tenantId, userId, {
      nombres: ' Juan ',
      apellidoPaterno: ' Perez ',
      apellidoMaterno: ' Gomez ',
      tipoParticipante: 'PADRONADO',
      fechaRegistro: '2026-02-28',
    });

    expect(tx.personas.aggregate).toHaveBeenCalledWith({
      where: { id_tenant: tenantId, nro_padron: { not: null } },
      _max: { nro_padron: true },
    });
    expect(tx.personas.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nro_padron: 25,
          tipo_participante: 'PADRONADO',
          estado: 'ACTIVO',
          fecha_baja: null,
        }),
      }),
    );
    expect(result.nroPadron).toBe(25);
  });

  it('actualiza estado y fechaBaja cuando vienen en el body', async () => {
    const fechaBaja = new Date('2026-04-10T00:00:00.000Z');
    const tx = createTx({
      personas: {
        aggregate: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(persona()),
        update: jest.fn().mockResolvedValue(
          persona({
            estado: 'RETIRADO',
            fecha_baja: fechaBaja,
          }),
        ),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    const result = await service.update(tenantId, userId, 12n, {
      estado: 'RETIRADO',
      fechaBaja: '2026-04-10',
    });

    expect(tx.personas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'RETIRADO',
          fecha_baja: fechaBaja,
        }),
      }),
    );
    expect(result.estado).toBe('RETIRADO');
    expect(result.fechaBaja).toEqual(fechaBaja);
  });

  it('lista personas ordenadas ascendentemente por nroPadron', async () => {
    const tx = createTx();
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await service.findAll(tenantId, userId, {});

    expect(tx.personas.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { nro_padron: { sort: 'asc', nulls: 'last' } },
          { id_persona: 'asc' },
        ],
      }),
    );
  });

  it('asigna nroPadron automaticamente al cambiar una persona a PADRONADO', async () => {
    const tx = createTx({
      personas: {
        aggregate: jest.fn().mockResolvedValue({ _max: { nro_padron: 8 } }),
        findUnique: jest.fn().mockResolvedValue(persona()),
        update: jest.fn().mockResolvedValue(
          persona({
            nro_padron: 9,
            tipo_participante: 'PADRONADO',
          }),
        ),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    const result = await service.update(tenantId, userId, 12n, {
      tipoParticipante: 'PADRONADO',
    });

    expect(tx.personas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo_participante: 'PADRONADO',
          nro_padron: 9,
        }),
      }),
    );
    expect(result.nroPadron).toBe(9);
  });

  it('permite cambiar manualmente nroPadron en una persona PADRONADO', async () => {
    const tx = createTx({
      personas: {
        aggregate: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(
          persona({
            nro_padron: 9,
            tipo_participante: 'PADRONADO',
          }),
        ),
        update: jest.fn().mockResolvedValue(
          persona({
            nro_padron: 30,
            tipo_participante: 'PADRONADO',
          }),
        ),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    const result = await service.update(tenantId, userId, 12n, {
      nroPadron: 30,
    });

    expect(tx.personas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nro_padron: 30,
        }),
      }),
    );
    expect(tx.personas.aggregate).not.toHaveBeenCalled();
    expect(result.nroPadron).toBe(30);
  });

  it('rechaza nroPadron manual si la persona no es PADRONADO', async () => {
    const tx = createTx({
      personas: {
        aggregate: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(persona()),
        update: jest.fn(),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(
      service.update(tenantId, userId, 12n, { nroPadron: 30 }),
    ).rejects.toEqual(
      new BadRequestException(
        'nroPadron solo puede registrarse cuando tipoParticipante es PADRONADO.',
      ),
    );
    expect(tx.personas.update).not.toHaveBeenCalled();
  });

  it('elimina fisicamente la persona y limpia historial interno de condiciones', async () => {
    const tx = createTx();
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await service.remove(tenantId, userId, 12n);

    expect(tx.persona_condiciones.deleteMany).toHaveBeenCalledWith({
      where: { id_tenant: tenantId, id_persona: 12n },
    });
    expect(tx.personas.delete).toHaveBeenCalledWith({
      where: {
        id_tenant_id_persona: {
          id_tenant: tenantId,
          id_persona: 12n,
        },
      },
    });
    expect(tx.personas.update).not.toHaveBeenCalled();
  });

  it('rechaza delete fisico si existen relaciones asociadas', async () => {
    const tx = createTx({
      personas: {
        aggregate: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(persona()),
        update: jest.fn(),
        delete: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Foreign key violation', {
            code: 'P2003',
            clientVersion: 'test',
          }),
        ),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(service.remove(tenantId, userId, 12n)).rejects.toEqual(
      new ConflictException(
        'No se puede eliminar la persona porque tiene relaciones asociadas.',
      ),
    );
  });

  it('rechaza si el usuario no pertenece al tenant activo', async () => {
    const tx = createTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(service.findAll(tenantId, userId, {})).rejects.toEqual(
      new ForbiddenException('El usuario no pertenece al tenant activo.'),
    );
  });
});
