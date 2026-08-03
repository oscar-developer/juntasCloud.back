import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditoMovimientoDto } from './dto/create-credito-movimiento.dto';
import { CreditoMovimientoResponseDto } from './dto/credito-movimiento-response.dto';
import { QueryCreditoMovimientosDto } from './dto/query-credito-movimientos.dto';

@Injectable()
export class CreditoMovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    idCredito: bigint,
    dto: CreateCreditoMovimientoDto,
  ): Promise<CreditoMovimientoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureCreditoExists(tx, tenantId, idCredito);
      const item = await tx.credito_movimientos.create({
        data: {
          id_tenant: tenantId,
          id_credito: idCredito,
          tipo_movimiento: dto.tipoMovimiento,
          cantidad: dto.cantidad,
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
    idCredito: bigint,
    query: QueryCreditoMovimientosDto,
  ): Promise<CreditoMovimientoResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureCreditoExists(tx, tenantId, idCredito);
      const from = query.from ? this.toDateTime(query.from, 'from') : undefined;
      const to = query.to ? this.toDateTime(query.to, 'to') : undefined;
      const items = await tx.credito_movimientos.findMany({
        where: {
          id_tenant: tenantId,
          id_credito: idCredito,
          tipo_movimiento: query.tipoMovimiento,
          fecha_movimiento: from || to ? { gte: from, lte: to } : undefined,
        },
        orderBy: { id_credito_movimiento: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idCreditoMovimiento: bigint,
  ): Promise<CreditoMovimientoResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.credito_movimientos.findUnique({
        where: {
          id_tenant_id_credito_movimiento: {
            id_tenant: tenantId,
            id_credito_movimiento: idCreditoMovimiento,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el movimiento de crédito solicitado.');
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

  private async ensureCreditoExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idCredito: bigint,
  ): Promise<void> {
    const exists = await tx.creditos_persona.findUnique({
      where: {
        id_tenant_id_credito: {
          id_tenant: tenantId,
          id_credito: idCredito,
        },
      },
      select: { id_credito: true },
    });
    if (!exists) {
      throw new NotFoundException('El crédito indicado no existe en el tenant activo.');
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
    id_credito_movimiento: bigint;
    id_credito: bigint;
    tipo_movimiento: string;
    cantidad: Prisma.Decimal;
    fecha_movimiento: Date;
    referencia_tipo: string | null;
    referencia_id: bigint | null;
    observaciones: string | null;
    created_by_user: bigint;
  }): CreditoMovimientoResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idCreditoMovimiento: Number(item.id_credito_movimiento),
      idCredito: Number(item.id_credito),
      tipoMovimiento: item.tipo_movimiento,
      cantidad: Number(item.cantidad),
      fechaMovimiento: item.fecha_movimiento,
      referenciaTipo: item.referencia_tipo,
      referenciaId: item.referencia_id === null ? null : Number(item.referencia_id),
      observaciones: item.observaciones,
      createdByUser: Number(item.created_by_user),
    };
  }
}
