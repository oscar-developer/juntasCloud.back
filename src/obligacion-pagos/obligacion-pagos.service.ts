import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligacionPagoDto } from './dto/create-obligacion-pago.dto';
import { ObligacionPagoResponseDto } from './dto/obligacion-pago-response.dto';

@Injectable()
export class ObligacionPagosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
    dto: CreateObligacionPagoDto,
  ): Promise<ObligacionPagoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureObligacionExists(tx, tenantId, idObligacion);
      await this.ensureMovimientoExists(tx, tenantId, BigInt(dto.idMovimiento));

      const item = await tx.obligacion_pagos.create({
        data: {
          id_tenant: tenantId,
          id_obligacion: idObligacion,
          id_movimiento: BigInt(dto.idMovimiento),
          monto_aplicado: dto.montoAplicado,
          created_by_user: userId,
        },
      });

      return this.toResponse(item);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
  ): Promise<ObligacionPagoResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureObligacionExists(tx, tenantId, idObligacion);
      const items = await tx.obligacion_pagos.findMany({
        where: { id_tenant: tenantId, id_obligacion: idObligacion },
        orderBy: { id_obligacion_pago: 'desc' },
      });
      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idObligacionPago: bigint,
  ): Promise<ObligacionPagoResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.obligacion_pagos.findUnique({
        where: {
          id_tenant_id_obligacion_pago: {
            id_tenant: tenantId,
            id_obligacion_pago: idObligacionPago,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el pago de obligación solicitado.');
    }

    return this.toResponse(item);
  }

  parseId(value: string, field: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
    return BigInt(value);
  }

  private async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
      );
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`,
      );
      const membership = await tx.tenant_users.findFirst({
        where: { id_tenant: tenantId, id_user: userId, estado: 'ACTIVO' },
        select: { id_user: true },
      });
      if (!membership) {
        throw new ForbiddenException('El usuario no pertenece al tenant activo.');
      }
      return fn(tx);
    });
  }

  private async ensureObligacionExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idObligacion: bigint,
  ): Promise<void> {
    const exists = await tx.obligaciones_persona.findUnique({
      where: {
        id_tenant_id_obligacion: {
          id_tenant: tenantId,
          id_obligacion: idObligacion,
        },
      },
      select: { id_obligacion: true },
    });
    if (!exists) {
      throw new NotFoundException('La obligación indicada no existe en el tenant activo.');
    }
  }

  private async ensureMovimientoExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idMovimiento: bigint,
  ): Promise<void> {
    const exists = await tx.caja_movimientos.findUnique({
      where: {
        id_tenant_id_movimiento: {
          id_tenant: tenantId,
          id_movimiento: idMovimiento,
        },
      },
      select: { id_movimiento: true },
    });
    if (!exists) {
      throw new NotFoundException(
        'El movimiento de caja indicado no existe en el tenant activo.',
      );
    }
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_obligacion_pago: bigint;
    id_obligacion: bigint;
    id_movimiento: bigint;
    monto_aplicado: Prisma.Decimal;
    created_at: Date;
    created_by_user: bigint;
  }): ObligacionPagoResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idObligacionPago: Number(item.id_obligacion_pago),
      idObligacion: Number(item.id_obligacion),
      idMovimiento: Number(item.id_movimiento),
      montoAplicado: Number(item.monto_aplicado),
      createdAt: item.created_at,
      createdByUser: Number(item.created_by_user),
    };
  }
}
