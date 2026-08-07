import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligacionMovimientoDto } from './dto/create-obligacion-movimiento.dto';
import { ObligacionMovimientoResponseDto } from './dto/obligacion-movimiento-response.dto';
import { QueryObligacionMovimientosDto } from './dto/query-obligacion-movimientos.dto';

@Injectable()
export class ObligacionMovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
    dto: CreateObligacionMovimientoDto,
  ): Promise<ObligacionMovimientoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureObligacionExists(tx, tenantId, idObligacion);
      const item = await tx.obligacion_movimientos.create({
        data: {
          id_tenant: tenantId,
          id_obligacion: idObligacion,
          tipo_movimiento: dto.tipoMovimiento,
          monto: dto.monto,
          fecha_movimiento:
            dto.fechaMovimiento !== undefined
              ? this.toDateTime(dto.fechaMovimiento, 'fechaMovimiento')
              : undefined,
          referencia_tipo: this.normalizeNullableText(dto.referenciaTipo),
          referencia_id: dto.referenciaId ? BigInt(dto.referenciaId) : null,
          observaciones: this.normalizeNullableText(dto.observaciones),
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
    query: QueryObligacionMovimientosDto,
  ): Promise<ObligacionMovimientoResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureObligacionExists(tx, tenantId, idObligacion);
      const from = query.from ? this.toDateTime(query.from, 'from') : undefined;
      const to = query.to ? this.toDateTime(query.to, 'to') : undefined;
      const items = await tx.obligacion_movimientos.findMany({
        where: {
          id_tenant: tenantId,
          id_obligacion: idObligacion,
          tipo_movimiento: query.tipoMovimiento,
          fecha_movimiento: from || to ? { gte: from, lte: to } : undefined,
        },
        orderBy: { id_obligacion_movimiento: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idObligacionMovimiento: bigint,
  ): Promise<ObligacionMovimientoResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.obligacion_movimientos.findUnique({
        where: {
          id_tenant_id_obligacion_movimiento: {
            id_tenant: tenantId,
            id_obligacion_movimiento: idObligacionMovimiento,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el movimiento de obligación solicitado.');
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
    return this.prisma.withTenantContext(userId, tenantId, async (tx) => {
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

  private normalizeNullableText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.trim();
    return normalized || null;
  }

  private toDateTime(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} no tiene formato valido.`);
    }
    return date;
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_obligacion_movimiento: bigint;
    id_obligacion: bigint;
    tipo_movimiento: string;
    monto: Prisma.Decimal;
    fecha_movimiento: Date;
    referencia_tipo: string | null;
    referencia_id: bigint | null;
    observaciones: string | null;
    created_by_user: bigint;
  }): ObligacionMovimientoResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idObligacionMovimiento: Number(item.id_obligacion_movimiento),
      idObligacion: Number(item.id_obligacion),
      tipoMovimiento: item.tipo_movimiento,
      monto: Number(item.monto),
      fechaMovimiento: item.fecha_movimiento,
      referenciaTipo: item.referencia_tipo,
      referenciaId: item.referencia_id === null ? null : Number(item.referencia_id),
      observaciones: item.observaciones,
      createdByUser: Number(item.created_by_user),
    };
  }
}
