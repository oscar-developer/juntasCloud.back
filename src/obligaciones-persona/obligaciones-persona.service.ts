import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnularObligacionPersonaDto } from './dto/anular-obligacion-persona.dto';
import { CreateObligacionPersonaDto } from './dto/create-obligacion-persona.dto';
import { ObligacionPersonaResponseDto } from './dto/obligacion-persona-response.dto';
import { QueryObligacionesPersonaDto } from './dto/query-obligaciones-persona.dto';
import { UpdateObligacionPersonaDto } from './dto/update-obligacion-persona.dto';

@Injectable()
export class ObligacionesPersonaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateObligacionPersonaDto,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));
      await this.ensureConceptoExists(tx, tenantId, BigInt(dto.idConceptoCobro));
      if (dto.idFaena !== undefined && dto.idFaena !== null) {
        await this.ensureFaenaExists(tx, tenantId, BigInt(dto.idFaena));
      }
      if (dto.idAsamblea !== undefined && dto.idAsamblea !== null) {
        await this.ensureAsambleaExists(tx, tenantId, BigInt(dto.idAsamblea));
      }

      const item = await tx.obligaciones_persona.create({
        data: {
          id_tenant: tenantId,
          id_persona: BigInt(dto.idPersona),
          id_concepto_cobro: BigInt(dto.idConceptoCobro),
          periodo: this.normalizeNullableText(dto.periodo),
          fecha_emision: this.toDateOnly(dto.fechaEmision, 'fechaEmision'),
          fecha_vencimiento: this.toOptionalDateOnly(dto.fechaVencimiento, 'fechaVencimiento'),
          monto_original: dto.montoOriginal,
          monto_pagado: dto.montoPagado ?? 0,
          monto_exonerado: dto.montoExonerado ?? 0,
          monto_compensado: dto.montoCompensado ?? 0,
          saldo: dto.saldo,
          estado: dto.estado ?? 'PENDIENTE',
          id_faena: dto.idFaena ? BigInt(dto.idFaena) : null,
          id_asamblea: dto.idAsamblea ? BigInt(dto.idAsamblea) : null,
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
    query: QueryObligacionesPersonaDto,
  ): Promise<ObligacionPersonaResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const items = await tx.obligaciones_persona.findMany({
        where: {
          id_tenant: tenantId,
          id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
          id_concepto_cobro: query.idConceptoCobro ? BigInt(query.idConceptoCobro) : undefined,
          estado: query.estado,
          id_faena: query.idFaena ? BigInt(query.idFaena) : undefined,
          id_asamblea: query.idAsamblea ? BigInt(query.idAsamblea) : undefined,
        },
        orderBy: { id_obligacion: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
  ): Promise<ObligacionPersonaResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.obligaciones_persona.findUnique({
        where: {
          id_tenant_id_obligacion: {
            id_tenant: tenantId,
            id_obligacion: idObligacion,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro la obligación solicitada.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
    dto: UpdateObligacionPersonaDto,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.obligaciones_persona.findUnique({
        where: {
          id_tenant_id_obligacion: {
            id_tenant: tenantId,
            id_obligacion: idObligacion,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la obligación solicitada.');
      }
      if (current.estado === 'ANULADA') {
        throw new ConflictException('No se puede editar una obligación anulada.');
      }

      if (dto.idPersona !== undefined) {
        await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));
      }
      if (dto.idConceptoCobro !== undefined) {
        await this.ensureConceptoExists(tx, tenantId, BigInt(dto.idConceptoCobro));
      }
      if (dto.idFaena !== undefined && dto.idFaena !== null) {
        await this.ensureFaenaExists(tx, tenantId, BigInt(dto.idFaena));
      }
      if (dto.idAsamblea !== undefined && dto.idAsamblea !== null) {
        await this.ensureAsambleaExists(tx, tenantId, BigInt(dto.idAsamblea));
      }

      const item = await tx.obligaciones_persona.update({
        where: {
          id_tenant_id_obligacion: {
            id_tenant: tenantId,
            id_obligacion: idObligacion,
          },
        },
        data: {
          id_persona: dto.idPersona !== undefined ? BigInt(dto.idPersona) : undefined,
          id_concepto_cobro:
            dto.idConceptoCobro !== undefined ? BigInt(dto.idConceptoCobro) : undefined,
          periodo: this.normalizeOptionalNullableText(dto.periodo),
          fecha_emision:
            dto.fechaEmision !== undefined
              ? this.toDateOnly(dto.fechaEmision, 'fechaEmision')
              : undefined,
          fecha_vencimiento:
            dto.fechaVencimiento !== undefined
              ? this.toOptionalDateOnly(dto.fechaVencimiento, 'fechaVencimiento')
              : undefined,
          monto_original: dto.montoOriginal,
          monto_pagado: dto.montoPagado,
          monto_exonerado: dto.montoExonerado,
          monto_compensado: dto.montoCompensado,
          saldo: dto.saldo,
          estado: dto.estado,
          id_faena: this.toOptionalBigInt(dto.idFaena),
          id_asamblea: this.toOptionalBigInt(dto.idAsamblea),
          observaciones: this.normalizeOptionalNullableText(dto.observaciones),
          updated_at: new Date(),
          updated_by_user: userId,
        },
      });

      return this.toResponse(item);
    });
  }

  async anular(
    tenantId: bigint,
    userId: bigint,
    idObligacion: bigint,
    dto: AnularObligacionPersonaDto,
  ): Promise<ObligacionPersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.obligaciones_persona.findUnique({
        where: {
          id_tenant_id_obligacion: {
            id_tenant: tenantId,
            id_obligacion: idObligacion,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la obligación solicitada.');
      }
      if (current.estado === 'ANULADA') {
        throw new ConflictException('La obligación ya se encuentra anulada.');
      }

      const item = await tx.obligaciones_persona.update({
        where: {
          id_tenant_id_obligacion: {
            id_tenant: tenantId,
            id_obligacion: idObligacion,
          },
        },
        data: {
          estado: 'ANULADA',
          anulada_at: new Date(),
          anulada_by_user: userId,
          motivo_anulacion: this.normalizeRequiredText(dto.motivoAnulacion, 'motivoAnulacion'),
          updated_at: new Date(),
          updated_by_user: userId,
        },
      });

      return this.toResponse(item);
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idObligacion debe ser un entero positivo.');
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

  private async ensureConceptoExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idConceptoCobro: bigint,
  ): Promise<void> {
    const exists = await tx.conceptos_cobro.findUnique({
      where: {
        id_tenant_id_concepto_cobro: {
          id_tenant: tenantId,
          id_concepto_cobro: idConceptoCobro,
        },
      },
      select: { id_concepto_cobro: true },
    });
    if (!exists) {
      throw new NotFoundException('El concepto de cobro indicado no existe en el tenant activo.');
    }
  }

  private async ensureFaenaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idFaena: bigint,
  ): Promise<void> {
    const exists = await tx.faenas.findUnique({
      where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: idFaena } },
      select: { id_faena: true },
    });
    if (!exists) {
      throw new NotFoundException('La faena indicada no existe en el tenant activo.');
    }
  }

  private async ensureAsambleaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idAsamblea: bigint,
  ): Promise<void> {
    const exists = await tx.asambleas.findUnique({
      where: { id_tenant_id_asamblea: { id_tenant: tenantId, id_asamblea: idAsamblea } },
      select: { id_asamblea: true },
    });
    if (!exists) {
      throw new NotFoundException('La asamblea indicada no existe en el tenant activo.');
    }
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
    return normalized;
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

  private toDateOnly(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} no tiene formato valido.`);
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private toOptionalDateOnly(
    value: string | null | undefined,
    field: string,
  ): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return this.toDateOnly(value, field);
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

  private toResponse(item: {
    id_tenant: bigint;
    id_obligacion: bigint;
    id_persona: bigint;
    id_concepto_cobro: bigint;
    periodo: string | null;
    fecha_emision: Date;
    fecha_vencimiento: Date | null;
    monto_original: Prisma.Decimal;
    monto_pagado: Prisma.Decimal;
    monto_exonerado: Prisma.Decimal;
    monto_compensado: Prisma.Decimal;
    saldo: Prisma.Decimal;
    estado: string;
    id_faena: bigint | null;
    id_asamblea: bigint | null;
    observaciones: string | null;
    created_at: Date;
    created_by_user: bigint;
    updated_at: Date | null;
    updated_by_user: bigint | null;
    anulada_at: Date | null;
    anulada_by_user: bigint | null;
    motivo_anulacion: string | null;
  }): ObligacionPersonaResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idObligacion: Number(item.id_obligacion),
      idPersona: Number(item.id_persona),
      idConceptoCobro: Number(item.id_concepto_cobro),
      periodo: item.periodo,
      fechaEmision: item.fecha_emision,
      fechaVencimiento: item.fecha_vencimiento,
      montoOriginal: Number(item.monto_original),
      montoPagado: Number(item.monto_pagado),
      montoExonerado: Number(item.monto_exonerado),
      montoCompensado: Number(item.monto_compensado),
      saldo: Number(item.saldo),
      estado: item.estado,
      idFaena: item.id_faena === null ? null : Number(item.id_faena),
      idAsamblea: item.id_asamblea === null ? null : Number(item.id_asamblea),
      observaciones: item.observaciones,
      createdAt: item.created_at,
      createdByUser: Number(item.created_by_user),
      updatedAt: item.updated_at,
      updatedByUser: item.updated_by_user === null ? null : Number(item.updated_by_user),
      anuladaAt: item.anulada_at,
      anuladaByUser: item.anulada_by_user === null ? null : Number(item.anulada_by_user),
      motivoAnulacion: item.motivo_anulacion,
    };
  }
}
