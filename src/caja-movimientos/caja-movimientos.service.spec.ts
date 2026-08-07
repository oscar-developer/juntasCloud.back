import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CajaMovimientosService } from './caja-movimientos.service';

describe('CajaMovimientosService', () => {
  let service: CajaMovimientosService;
  let prisma: {
    $transaction: jest.Mock;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      withTenantContext: jest.fn((_userId, _tenantId, fn) => prisma.$transaction(fn)),
    };

    service = new CajaMovimientosService(prisma as unknown as PrismaService);
  });

  it('create crea movimiento con categoria valida y activa', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_categoria_caja: 3n,
          nombre: 'Cuotas',
          tipo: 'INGRESO',
          activo: true,
        }),
      },
      caja_movimientos: {
        create: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          fecha: new Date('2026-03-01T00:00:00.000Z'),
          tipo: 'INGRESO',
          monto: 120.5,
          id_categoria_caja: 3n,
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
          id_user: 9n,
          descripcion: 'Ingreso comunal',
          medio_pago: 'YAPE',
          doc_referencia: 'REC-01',
          observaciones: null,
          created_at: new Date('2026-03-01T10:00:00.000Z'),
          created_by_user: 9n,
          updated_at: null,
          updated_by_user: null,
          anulado: false,
          anulado_at: null,
          anulado_by_user: null,
          motivo_anulacion: null,
          caja_categorias: {
            id_categoria_caja: 3n,
            nombre: 'Cuotas',
            tipo: 'INGRESO',
            activo: true,
          },
        }),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.create(2n, 9n, {
      fecha: '2026-03-01',
      tipo: 'INGRESO',
      monto: 120.5,
      idCategoriaCaja: 3,
      medioPago: 'YAPE',
      descripcion: 'Ingreso comunal',
      docReferencia: 'REC-01',
    });

    expect(tx.caja_categorias.findUnique).toHaveBeenCalledWith({
      where: {
        id_tenant_id_categoria_caja: {
          id_tenant: 2n,
          id_categoria_caja: 3n,
        },
      },
      select: {
        id_categoria_caja: true,
        nombre: true,
        tipo: true,
        activo: true,
      },
    });
    expect(tx.caja_movimientos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_tenant: 2n,
          tipo: 'INGRESO',
          monto: 120.5,
          id_categoria_caja: 3n,
          medio_pago: 'YAPE',
          created_by_user: 9n,
        }),
      }),
    );
    expect(result.idMovimiento).toBe(11);
    expect(result.categoriaNombre).toBe('Cuotas');
  });

  it('create rechaza categoria inexistente', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      caja_movimientos: {
        create: jest.fn(),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.create(2n, 9n, {
        fecha: '2026-03-01',
        tipo: 'INGRESO',
        monto: 50,
        idCategoriaCaja: 99,
        medioPago: 'EFECTIVO',
      }),
    ).rejects.toEqual(
      new NotFoundException('La categoria de caja indicada no existe en el tenant activo.'),
    );
    expect(tx.caja_movimientos.create).not.toHaveBeenCalled();
  });

  it('update rechaza categoria inactiva', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_movimientos: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          tipo: 'INGRESO',
          id_categoria_caja: 3n,
          anulado: false,
        }),
        update: jest.fn(),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_categoria_caja: 4n,
          nombre: 'Aportes',
          tipo: 'INGRESO',
          activo: false,
        }),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.update(2n, 9n, 11n, {
        idCategoriaCaja: 4,
      }),
    ).rejects.toEqual(
      new ConflictException('La categoria de caja indicada se encuentra inactiva.'),
    );
    expect(tx.caja_movimientos.update).not.toHaveBeenCalled();
  });

  it('create rechaza desajuste entre tipo del movimiento y tipo de categoria', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_categoria_caja: 3n,
          nombre: 'Servicios',
          tipo: 'GASTO',
          activo: true,
        }),
      },
      caja_movimientos: {
        create: jest.fn(),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.create(2n, 9n, {
        fecha: '2026-03-01',
        tipo: 'INGRESO',
        monto: 80,
        idCategoriaCaja: 3,
        medioPago: 'EFECTIVO',
      }),
    ).rejects.toEqual(
      new BadRequestException(
        'La categoria de caja indicada no corresponde al tipo de movimiento seleccionado.',
      ),
    );
    expect(tx.caja_movimientos.create).not.toHaveBeenCalled();
  });

  it('anular marca anulado y completa campos de auditoria', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_movimientos: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          anulado: false,
        }),
        update: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          fecha: new Date('2026-03-01T00:00:00.000Z'),
          tipo: 'INGRESO',
          monto: 120.5,
          id_categoria_caja: 3n,
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
          id_user: 9n,
          descripcion: 'Ingreso comunal',
          medio_pago: 'YAPE',
          doc_referencia: 'REC-01',
          observaciones: null,
          created_at: new Date('2026-03-01T10:00:00.000Z'),
          created_by_user: 9n,
          updated_at: new Date('2026-03-01T12:00:00.000Z'),
          updated_by_user: 9n,
          anulado: true,
          anulado_at: new Date('2026-03-01T12:00:00.000Z'),
          anulado_by_user: 9n,
          motivo_anulacion: 'Registro duplicado',
          caja_categorias: {
            id_categoria_caja: 3n,
            nombre: 'Cuotas',
            tipo: 'INGRESO',
            activo: true,
          },
        }),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.anular(2n, 9n, 11n, {
      motivoAnulacion: ' Registro duplicado ',
    });

    expect(tx.caja_movimientos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          anulado: true,
          anulado_by_user: 9n,
          motivo_anulacion: 'Registro duplicado',
          updated_by_user: 9n,
        }),
      }),
    );
    expect(result.anulado).toBe(true);
    expect(result.anuladoByUser).toBe(9);
    expect(result.motivoAnulacion).toBe('Registro duplicado');
  });

  it('update impide editar movimiento ya anulado', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_movimientos: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          tipo: 'INGRESO',
          id_categoria_caja: 3n,
          anulado: true,
        }),
        update: jest.fn(),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.update(2n, 9n, 11n, {
        descripcion: 'Nuevo texto',
      }),
    ).rejects.toEqual(
      new ConflictException('No se puede editar un movimiento de caja anulado.'),
    );
    expect(tx.caja_movimientos.update).not.toHaveBeenCalled();
  });

  it('create acepta referencias opcionales en null y guarda SQL NULL', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_categoria_caja: 3n,
          nombre: 'Cuotas',
          tipo: 'INGRESO',
          activo: true,
        }),
      },
      caja_movimientos: {
        create: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 12n,
          fecha: new Date('2026-04-26T00:00:00.000Z'),
          tipo: 'INGRESO',
          monto: 500,
          id_categoria_caja: 3n,
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
          id_user: 9n,
          descripcion: 'monto de ingreso nueva persona',
          medio_pago: 'TRANSFERENCIA',
          doc_referencia: null,
          observaciones: null,
          created_at: new Date('2026-04-26T10:00:00.000Z'),
          created_by_user: 9n,
          updated_at: null,
          updated_by_user: null,
          anulado: false,
          anulado_at: null,
          anulado_by_user: null,
          motivo_anulacion: null,
          caja_categorias: {
            id_categoria_caja: 3n,
            nombre: 'Cuotas',
            tipo: 'INGRESO',
            activo: true,
          },
        }),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.create(2n, 9n, {
      fecha: '2026-04-26',
      tipo: 'INGRESO',
      monto: 500,
      idCategoriaCaja: 3,
      medioPago: 'TRANSFERENCIA',
      idPersona: null,
      idFaena: null,
      idAsamblea: null,
      idBien: null,
      descripcion: 'monto de ingreso nueva persona',
    });

    expect(tx.personas.findUnique).not.toHaveBeenCalled();
    expect(tx.faenas.findUnique).not.toHaveBeenCalled();
    expect(tx.asambleas.findUnique).not.toHaveBeenCalled();
    expect(tx.bienes.findUnique).not.toHaveBeenCalled();
    expect(tx.caja_movimientos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
        }),
      }),
    );
    expect(result.idBien).toBeNull();
  });

  it('update acepta null para limpiar relaciones opcionales', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_movimientos: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          fecha: new Date('2026-03-01T00:00:00.000Z'),
          tipo: 'INGRESO',
          monto: 120.5,
          id_categoria_caja: 3n,
          id_persona: 4n,
          id_faena: 5n,
          id_asamblea: 6n,
          id_bien: 7n,
          id_user: 9n,
          descripcion: 'Ingreso comunal',
          medio_pago: 'YAPE',
          doc_referencia: 'REC-01',
          observaciones: null,
          created_at: new Date('2026-03-01T10:00:00.000Z'),
          created_by_user: 9n,
          updated_at: null,
          updated_by_user: null,
          anulado: false,
          anulado_at: null,
          anulado_by_user: null,
          motivo_anulacion: null,
        }),
        update: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          fecha: new Date('2026-03-01T00:00:00.000Z'),
          tipo: 'INGRESO',
          monto: 120.5,
          id_categoria_caja: 3n,
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
          id_user: 9n,
          descripcion: 'Ingreso comunal',
          medio_pago: 'YAPE',
          doc_referencia: 'REC-01',
          observaciones: null,
          created_at: new Date('2026-03-01T10:00:00.000Z'),
          created_by_user: 9n,
          updated_at: new Date('2026-03-01T12:00:00.000Z'),
          updated_by_user: 9n,
          anulado: false,
          anulado_at: null,
          anulado_by_user: null,
          motivo_anulacion: null,
          caja_categorias: {
            id_categoria_caja: 3n,
            nombre: 'Cuotas',
            tipo: 'INGRESO',
            activo: true,
          },
        }),
      },
      caja_categorias: {
        findUnique: jest.fn().mockResolvedValue({
          id_categoria_caja: 3n,
          nombre: 'Cuotas',
          tipo: 'INGRESO',
          activo: true,
        }),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await service.update(2n, 9n, 11n, {
      idPersona: null,
      idFaena: null,
      idAsamblea: null,
      idBien: null,
    });

    expect(tx.personas.findUnique).not.toHaveBeenCalled();
    expect(tx.faenas.findUnique).not.toHaveBeenCalled();
    expect(tx.asambleas.findUnique).not.toHaveBeenCalled();
    expect(tx.bienes.findUnique).not.toHaveBeenCalled();
    expect(tx.caja_movimientos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_persona: null,
          id_faena: null,
          id_asamblea: null,
          id_bien: null,
        }),
      }),
    );
    expect(result.idPersona).toBeNull();
    expect(result.idBien).toBeNull();
  });

  it('create rechaza idBien inexistente', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_categorias: {
        findUnique: jest.fn(),
      },
      caja_movimientos: {
        create: jest.fn(),
      },
      personas: { findUnique: jest.fn() },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.create(2n, 9n, {
        fecha: '2026-04-26',
        tipo: 'INGRESO',
        monto: 500,
        idCategoriaCaja: 3,
        medioPago: 'TRANSFERENCIA',
        idBien: 999,
      }),
    ).rejects.toEqual(new NotFoundException('El bien indicado no existe en el tenant activo.'));
    expect(tx.caja_categorias.findUnique).not.toHaveBeenCalled();
    expect(tx.caja_movimientos.create).not.toHaveBeenCalled();
  });

  it('update rechaza idPersona inexistente', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      tenant_users: {
        findFirst: jest.fn().mockResolvedValue({ id_user: 9n }),
      },
      caja_movimientos: {
        findUnique: jest.fn().mockResolvedValue({
          id_tenant: 2n,
          id_movimiento: 11n,
          tipo: 'INGRESO',
          id_categoria_caja: 3n,
          anulado: false,
        }),
        update: jest.fn(),
      },
      caja_categorias: {
        findUnique: jest.fn(),
      },
      personas: { findUnique: jest.fn().mockResolvedValue(null) },
      faenas: { findUnique: jest.fn() },
      asambleas: { findUnique: jest.fn() },
      bienes: { findUnique: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (txClient: typeof tx) => Promise<unknown>) => fn(tx),
    );

    await expect(
      service.update(2n, 9n, 11n, {
        idPersona: 999,
      }),
    ).rejects.toEqual(
      new NotFoundException('La persona indicada no existe en el tenant activo.'),
    );
    expect(tx.caja_categorias.findUnique).not.toHaveBeenCalled();
    expect(tx.caja_movimientos.update).not.toHaveBeenCalled();
  });
});
