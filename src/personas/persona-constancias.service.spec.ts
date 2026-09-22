import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonaConstanciasService } from './persona-constancias.service';

describe('PersonaConstanciasService', () => {
  const tenantId = 7n;
  const userId = 9n;
  const personaId = 12n;
  let service: PersonaConstanciasService;
  let prisma: {
    withTenantContext: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeEach(() => {
    process.env.FRONTEND_BASE_URL = 'https://juntas.example.com';
    prisma = {
      withTenantContext: jest.fn(),
      $queryRaw: jest.fn(),
    };
    service = new PersonaConstanciasService(prisma as unknown as PrismaService);
  });

  function createTx() {
    return {
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: userId }),
      },
      tenants: {
        findUnique: jest.fn().mockResolvedValue({
          nombre: 'Asociacion Central',
          tipo_documento: 'RUC',
          numero_documento: '20123456789',
        }),
      },
      personas: {
        findUnique: jest.fn().mockResolvedValue({
          id_persona: personaId,
          nombres: 'Juan Carlos',
          apellido_paterno: 'Perez',
          apellido_materno: 'Gomez',
          dni: '12345678',
          nro_padron: 15,
          tipo_participante: 'PADRONADO',
          estado: 'ACTIVO',
          fecha_registro: new Date('2025-02-10T00:00:00.000Z'),
        }),
      },
      persona_terreno: {
        count: jest.fn().mockResolvedValue(2),
      },
      juntas_directivas: {
        findFirst: jest.fn().mockResolvedValue({
          id_junta: 3n,
          nombre: 'Junta 2026',
          fecha_inicio: new Date('2026-01-01T00:00:00.000Z'),
          fecha_fin: null,
          junta_miembros: [
            {
              cargo: 'PRESIDENTE',
              personas: {
                nombres: 'Ana',
                apellido_paterno: 'Torres',
                apellido_materno: 'Ruiz',
              },
            },
          ],
        }),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([
          {
            reporte: JSON.stringify({
              resumenFinanciero: { deudaPendienteTotal: 25.5 },
              resumenFaenas: {
                total: 4,
                asistencias: 2,
                faltas: 1,
                tardanzas: 1,
                porcentajeAsistencia: 75,
              },
              resumenAsambleas: {
                total: 2,
                asistencias: 2,
                faltas: 0,
                tardanzas: 0,
                porcentajeAsistencia: 100,
              },
            }),
          },
        ])
        .mockResolvedValueOnce([
          {
            id_constancia: 30n,
            issued_at: new Date('2026-09-21T15:45:00.000Z'),
          },
        ]),
    };
  }

  it('emite una constancia con codigo, snapshot y firmantes fijos', async () => {
    const tx = createTx();
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    const result = await service.issue(tenantId, userId, personaId);

    expect(result.codigo).toMatch(/^CP-\d{8}-[A-F0-9]{8}$/);
    expect(result.verificationUrl).toMatch(
      /^https:\/\/juntas\.example\.com\/verificar\/constancia\/[a-f0-9]{64}$/,
    );
    expect(result.snapshot.persona.nombreCompleto).toBe(
      'Perez Gomez Juan Carlos',
    );
    expect(result.snapshot.resumen.totalTerrenos).toBe(2);
    expect(result.snapshot.firmantes).toEqual([
      { cargo: 'PRESIDENTE', nombreCompleto: 'Torres Ruiz Ana' },
      { cargo: 'SECRETARIO', nombreCompleto: null },
      { cargo: 'TESORERO', nombreCompleto: null },
    ]);
    expect(result.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('rechaza la emision para un miembro sin rol administrativo', async () => {
    const tx = createTx();
    tx.tenant_users.findFirst.mockResolvedValue(null);
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(service.issue(tenantId, userId, personaId)).rejects.toEqual(
      new ForbiddenException('No tiene permisos para emitir constancias.'),
    );
    expect(tx.tenants.findUnique).not.toHaveBeenCalled();
  });

  it('devuelve una verificacion publica sin snapshot privado', async () => {
    const verification = {
      valida: true,
      estado: 'VIGENTE',
      codigo: 'CP-20260921-A1B2C3D4',
      issuedAt: '2026-09-21T15:45:00.000Z',
      revokedAt: null,
      motivoRevocacion: null,
      tenant: {
        nombre: 'Asociacion Central',
        tipoDocumento: 'RUC',
        numeroDocumento: '20123456789',
      },
      persona: {
        nombreCompleto: 'Perez Gomez Juan Carlos',
        dniEnmascarado: '****5678',
        nroPadron: 15,
        estado: 'ACTIVO',
      },
      snapshotHash: 'a'.repeat(64),
    };
    prisma.$queryRaw.mockResolvedValue([
      { reporte: JSON.stringify(verification) },
    ]);

    const result = await service.verify('b'.repeat(64));

    expect(result).toEqual(verification);
    expect(result).not.toHaveProperty('snapshot');
  });

  it('rechaza tokens publicos con formato invalido', async () => {
    await expect(service.verify('token-corto')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('revoca una constancia vigente dentro del tenant', async () => {
    const tx = createTx();
    tx.$queryRaw = jest.fn().mockResolvedValue([{ id_constancia: 30n }]);
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(
      service.revoke(
        tenantId,
        userId,
        personaId,
        30n,
        'Informacion incorrecta',
      ),
    ).resolves.toBeUndefined();
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('devuelve no encontrado al revocar una constancia inexistente', async () => {
    const tx = createTx();
    tx.$queryRaw = jest.fn().mockResolvedValue([{ id_constancia: null }]);
    prisma.withTenantContext.mockImplementation((_userId, _tenantId, fn) =>
      fn(tx),
    );

    await expect(
      service.revoke(
        tenantId,
        userId,
        personaId,
        99n,
        'Constancia incorrecta',
      ),
    ).rejects.toEqual(
      new NotFoundException('La constancia no existe o ya fue revocada.'),
    );
  });
});
