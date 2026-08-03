import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnularCreditoPersonaDto } from './dto/anular-credito-persona.dto';
import { CreateCreditoPersonaDto } from './dto/create-credito-persona.dto';
import { CreditoPersonaResponseDto } from './dto/credito-persona-response.dto';
import { QueryCreditosPersonaDto } from './dto/query-creditos-persona.dto';
import { UpdateCreditoPersonaDto } from './dto/update-credito-persona.dto';

@Injectable()
export class CreditosPersonaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateCreditoPersonaDto,
  ): Promise<CreditoPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));
      const item = await tx.creditos_persona.create({
        data: {
          id_tenant: tenantId,
          id_persona: BigInt(dto.idPersona),
          tipo_credito: dto.tipoCredito,
          cantidad_original: dto.cantidadOriginal,
          cantidad_disponible: dto.cantidadDisponible,
          equivalencia_monto: dto.equivalenciaMonto ?? null,
          referencia_tipo: this.normalizeNullableText(dto.referenciaTipo),
          referencia_id: dto.referenciaId ? BigInt(dto.referenciaId) : null,
          fecha_generacion:
            dto.fechaGeneracion !== undefined
              ? this.toDateTime(dto.fechaGeneracion, 'fechaGeneracion')
              : undefined,
          fecha_vencimiento: this.toOptionalDateTime(dto.fechaVencimiento, 'fechaVencimiento'),
          estado: dto.estado ?? 'DISPONIBLE',
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
    query: QueryCreditosPersonaDto,
  ): Promise<CreditoPersonaResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const items = await tx.creditos_persona.findMany({
        where: {
          id_tenant: tenantId,
          id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
          tipo_credito: query.tipoCredito,
          estado: query.estado,
        },
        orderBy: { id_credito: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idCredito: bigint,
  ): Promise<CreditoPersonaResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.creditos_persona.findUnique({
        where: {
          id_tenant_id_credito: {
            id_tenant: tenantId,
            id_credito: idCredito,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el crédito solicitado.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idCredito: bigint,
    dto: UpdateCreditoPersonaDto,
  ): Promise<CreditoPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.creditos_persona.findUnique({
        where: {
          id_tenant_id_credito: {
            id_tenant: tenantId,
            id_credito: idCredito,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro el crédito solicitado.');
      }
      if (current.estado === 'ANULADO') {
        throw new ConflictException('No se puede editar un crédito anulado.');
      }

      if (dto.idPersona !== undefined) {
        await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));
      }

      const item = await tx.creditos_persona.update({
        where: {
          id_tenant_id_credito: {
            id_tenant: tenantId,
            id_credito: idCredito,
          },
        },
        data: {
          id_persona: dto.idPersona !== undefined ? BigInt(dto.idPersona) : undefined,
          tipo_credito: dto.tipoCredito,
          cantidad_original: dto.cantidadOriginal,
          cantidad_disponible: dto.cantidadDisponible,
          equivalencia_monto: dto.equivalenciaMonto !== undefined ? dto.equivalenciaMonto : undefined,
          referencia_tipo: this.normalizeOptionalNullableText(dto.referenciaTipo),
          referencia_id: this.toOptionalBigInt(dto.referenciaId),
          fecha_generacion:
            dto.fechaGeneracion !== undefined
              ? this.toDateTime(dto.fechaGeneracion, 'fechaGeneracion')
              : undefined,
          fecha_vencimiento:
            dto.fechaVencimiento !== undefined
              ? this.toOptionalDateTime(dto.fechaVencimiento, 'fechaVencimiento')
              : undefined,
          estado: dto.estado,
          observaciones: this.normalizeOptionalNullableText(dto.observaciones),
        },
      });

      return this.toResponse(item);
    });
  }

  async anular(
    tenantId: bigint,
    userId: bigint,
    idCredito: bigint,
    dto: AnularCreditoPersonaDto,
  ): Promise<CreditoPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.creditos_persona.findUnique({
        where: {
          id_tenant_id_credito: {
            id_tenant: tenantId,
            id_credito: idCredito,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro el crédito solicitado.');
      }
      if (current.estado === 'ANULADO') {
        throw new ConflictException('El crédito ya se encuentra anulado.');
      }

      const item = await tx.creditos_persona.update({
        where: {
          id_tenant_id_credito: {
            id_tenant: tenantId,
            id_credito: idCredito,
          },
        },
        data: {
          estado: 'ANULADO',
          observaciones: this.appendAnulacionObservacion(current.observaciones, dto.motivoAnulacion),
        },
      });

      return this.toResponse(item);
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idCredito debe ser un entero positivo.');
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

  private async ensurePersonaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idPersona: bigint,
  ): Promise<void> {
    const exists = await tx.personas.findUnique({
      where: { id_tenant_id_persona: { id_tenant: tenantId, id_persona: idPersona } },
      select: { id_persona: true },
    });
    if (!exists) {
      throw new NotFoundException('La persona indicada no existe en el tenant activo.');
    }
  }

  private normalizeNullableText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.trim();
    return normalized || null;
  }

  private normalizeOptionalNullableText(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.normalizeNullableText(value);
  }

  private toDateTime(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} no tiene formato valido.`);
    }
    return date;
  }

  private toOptionalDateTime(
    value: string | null | undefined,
    field: string,
  ): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return this.toDateTime(value, field);
  }

  private toOptionalBigInt(value?: number | null): bigint | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return BigInt(value);
  }

  private appendAnulacionObservacion(
    current: string | null,
    motivoAnulacion: string,
  ): string {
    const motivo = motivoAnulacion.trim();
    if (!motivo) {
      throw new BadRequestException('motivoAnulacion es obligatorio.');
    }
    const prefix = current?.trim() ? `${current.trim()}\n` : '';
    return `${prefix}ANULADO: ${motivo}`;
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_credito: bigint;
    id_persona: bigint;
    tipo_credito: string;
    cantidad_original: Prisma.Decimal;
    cantidad_disponible: Prisma.Decimal;
    equivalencia_monto: Prisma.Decimal | null;
    referencia_tipo: string | null;
    referencia_id: bigint | null;
    fecha_generacion: Date;
    fecha_vencimiento: Date | null;
    estado: string;
    observaciones: string | null;
    created_at: Date;
    created_by_user: bigint;
  }): CreditoPersonaResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idCredito: Number(item.id_credito),
      idPersona: Number(item.id_persona),
      tipoCredito: item.tipo_credito,
      cantidadOriginal: Number(item.cantidad_original),
      cantidadDisponible: Number(item.cantidad_disponible),
      equivalenciaMonto: item.equivalencia_monto === null ? null : Number(item.equivalencia_monto),
      referenciaTipo: item.referencia_tipo,
      referenciaId: item.referencia_id === null ? null : Number(item.referencia_id),
      fechaGeneracion: item.fecha_generacion,
      fechaVencimiento: item.fecha_vencimiento,
      estado: item.estado,
      observaciones: item.observaciones,
      createdAt: item.created_at,
      createdByUser: Number(item.created_by_user),
    };
  }
}
