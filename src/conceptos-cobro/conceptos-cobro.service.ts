import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConceptoCobroResponseDto } from './dto/concepto-cobro-response.dto';
import { CreateConceptoCobroDto } from './dto/create-concepto-cobro.dto';
import { QueryConceptosCobroDto } from './dto/query-conceptos-cobro.dto';
import { UpdateConceptoCobroDto } from './dto/update-concepto-cobro.dto';

@Injectable()
export class ConceptosCobroService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateConceptoCobroDto,
  ): Promise<ConceptoCobroResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const item = await tx.conceptos_cobro.create({
        data: {
          id_tenant: tenantId,
          cod_concepto_cobro: this.buildCode(dto.nombre, 'CC'),
          nombre: this.normalizeRequiredText(dto.nombre, 'nombre'),
          tipo: dto.tipo,
          activo: dto.activo ?? true,
          requiere_periodo: dto.requierePeriodo ?? false,
          observaciones: this.normalizeNullableText(dto.observaciones),
        },
      });

      return this.toResponse(item);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryConceptosCobroDto,
  ): Promise<ConceptoCobroResponseDto[]> {
    const search = this.normalizeFilterText(query.search);

    return this.withTenantContext(userId, tenantId, async (tx) => {
      const items = await tx.conceptos_cobro.findMany({
        where: {
          id_tenant: tenantId,
          tipo: query.tipo,
          activo: query.activo,
          requiere_periodo: query.requierePeriodo,
          OR: search
            ? [{ nombre: { contains: search, mode: 'insensitive' } }]
            : undefined,
        },
        orderBy: { id_concepto_cobro: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idConceptoCobro: bigint,
  ): Promise<ConceptoCobroResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.conceptos_cobro.findUnique({
        where: {
          id_tenant_id_concepto_cobro: {
            id_tenant: tenantId,
            id_concepto_cobro: idConceptoCobro,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el concepto de cobro solicitado.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idConceptoCobro: bigint,
    dto: UpdateConceptoCobroDto,
  ): Promise<ConceptoCobroResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const item = await tx.conceptos_cobro.update({
          where: {
            id_tenant_id_concepto_cobro: {
              id_tenant: tenantId,
              id_concepto_cobro: idConceptoCobro,
            },
          },
          data: {
            nombre:
              dto.nombre !== undefined
                ? this.normalizeRequiredText(dto.nombre, 'nombre')
                : undefined,
            tipo: dto.tipo,
            activo: dto.activo,
            requiere_periodo: dto.requierePeriodo,
            observaciones: this.normalizeOptionalNullableText(dto.observaciones),
          },
        });

        return this.toResponse(item);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async remove(
    tenantId: bigint,
    userId: bigint,
    idConceptoCobro: bigint,
  ): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        await tx.conceptos_cobro.delete({
          where: {
            id_tenant_id_concepto_cobro: {
              id_tenant: tenantId,
              id_concepto_cobro: idConceptoCobro,
            },
          },
        });
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idConceptoCobro debe ser un entero positivo.');
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

  private normalizeFilterText(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar el concepto de cobro porque tiene obligaciones relacionadas.',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el concepto de cobro solicitado.');
      }
    }
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_concepto_cobro: bigint;
    nombre: string;
    tipo: string;
    activo: boolean;
    requiere_periodo: boolean;
    observaciones: string | null;
  }): ConceptoCobroResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idConceptoCobro: Number(item.id_concepto_cobro),
      nombre: item.nombre,
      tipo: item.tipo,
      activo: item.activo,
      requierePeriodo: item.requiere_periodo,
      observaciones: item.observaciones,
    };
  }

  private buildCode(value: string, prefix: string): string {
    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 12);
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    return `${prefix}_${normalized || 'ITEM'}_${suffix}`.slice(0, 20);
  }
}
