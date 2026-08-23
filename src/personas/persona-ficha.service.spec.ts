import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PersonaFichaService } from './persona-ficha.service';

describe('PersonaFichaService', () => {
  let service: PersonaFichaService;
  let prisma: {
    withTenantContext: jest.Mock;
  };

  const tenantId = 7n;
  const userId = 9n;
  const personaId = 12n;

  beforeEach(() => {
    prisma = {
      withTenantContext: jest.fn((_userId, _tenantId, fn) => fn(createTx())),
    };
    service = new PersonaFichaService(prisma as unknown as PrismaService);
  });

  function createTx(overrides: Record<string, unknown> = {}) {
    return {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: userId }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify({ ok: true }) }]),
      ...overrides,
    };
  }

  it('obtiene el resumen de ficha desde la funcion PostgreSQL', async () => {
    const ficha = {
      persona: { idPersona: 12, nombreCompleto: 'Juan Perez Gomez' },
      resumenFinanciero: { deudaPendienteTotal: 20 },
      resumenFaenas: { total: 0, asistencias: 0, faltas: 0, tardanzas: 0, porcentajeAsistencia: 0 },
      resumenAsambleas: { total: 0, asistencias: 0, faltas: 0, tardanzas: 0, porcentajeAsistencia: 0 },
      ultimosEventos: [],
    };
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify(ficha) }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    const result = await service.getFicha(tenantId, userId, personaId);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ficha);
  });

  it('devuelve paginacion de asistencias desde la funcion PostgreSQL', async () => {
    const response = { items: [], total: 0, page: 2, limit: 10 };
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify(response) }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    const result = await service.getAsistencias(tenantId, userId, personaId, {
      tipo: 'FAENA',
      estado: 'FALTO',
      anio: 2026,
      page: 2,
      limit: 10,
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual(response);
  });

  it('devuelve paginacion de obligaciones desde la funcion PostgreSQL', async () => {
    const response = { items: [], total: 0, page: 1, limit: 20 };
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify(response) }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    const result = await service.getObligaciones(tenantId, userId, personaId, {
      estado: 'PENDIENTE',
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual(response);
  });

  it('devuelve paginacion de pagos desde la funcion PostgreSQL', async () => {
    const response = { items: [], total: 0, page: 1, limit: 20 };
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify(response) }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    const result = await service.getPagos(tenantId, userId, personaId, {});

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual(response);
  });

  it('devuelve terrenos desde la funcion PostgreSQL', async () => {
    const terrenos = [{ idTerreno: 4, tipoRelacion: 'PROPIETARIO' }];
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: JSON.stringify(terrenos) }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    const result = await service.getTerrenos(tenantId, userId, personaId);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual(terrenos);
  });

  it('traduce resultado null como persona no encontrada', async () => {
    const tx = createTx({
      $queryRaw: jest.fn().mockResolvedValue([{ reporte: null }]),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    await expect(service.getFicha(tenantId, userId, personaId)).rejects.toEqual(
      new NotFoundException('No se encontro la persona solicitada.'),
    );
  });

  it('rechaza usuario sin membresia activa', async () => {
    const tx = createTx({
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $queryRaw: jest.fn(),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    await expect(service.getFicha(tenantId, userId, personaId)).rejects.toEqual(
      new ForbiddenException('El usuario no pertenece al tenant activo.'),
    );
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it('traduce errores de contexto de sesion', async () => {
    const tx = createTx({
      $queryRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError('missing app.tenant_id', {
          clientVersion: '7.0.0',
        }),
      ),
    });
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) => fn(tx));

    await expect(service.getFicha(tenantId, userId, personaId)).rejects.toEqual(
      new BadRequestException('No se pudo consultar la ficha porque falta contexto de sesion.'),
    );
  });
});
