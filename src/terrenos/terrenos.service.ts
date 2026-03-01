import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerrenoDto } from './dto/create-terreno.dto';
import { QueryTerrenosDto } from './dto/query-terrenos.dto';
import { TerrenoResponseDto } from './dto/terreno-response.dto';
import { UpdateTerrenoDto } from './dto/update-terreno.dto';

@Injectable()
export class TerrenosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: bigint, userId: bigint, dto: CreateTerrenoDto): Promise<TerrenoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const terreno = await tx.terrenos.create({
        data: {
          id_tenant: tenantId,
          descripcion: this.normalizeRequiredText(dto.descripcion, 'descripcion'),
          area_aprox_m2: dto.areaAproxM2 ?? null,
          estado: dto.estado ?? 'EN_USO',
          observaciones: this.normalizeNullableText(dto.observaciones),
        },
      });
      return this.toResponse(terreno);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryTerrenosDto,
  ): Promise<TerrenoResponseDto[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    return this.withTenantContext(userId, tenantId, async (tx) => {
      const terrenos = await tx.terrenos.findMany({
        where: {
          id_tenant: tenantId,
          estado: query.estado,
          descripcion: search ? { contains: search, mode: 'insensitive' } : undefined,
        },
        orderBy: { id_terreno: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return terrenos.map((terreno) => this.toResponse(terreno));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idTerreno: bigint,
  ): Promise<TerrenoResponseDto> {
    const terreno = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.terrenos.findUnique({
        where: {
          id_tenant_id_terreno: {
            id_tenant: tenantId,
            id_terreno: idTerreno,
          },
        },
      }),
    );

    if (!terreno) {
      throw new NotFoundException('No se encontro el terreno solicitado.');
    }

    return this.toResponse(terreno);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idTerreno: bigint,
    dto: UpdateTerrenoDto,
  ): Promise<TerrenoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const terreno = await tx.terrenos.update({
          where: {
            id_tenant_id_terreno: {
              id_tenant: tenantId,
              id_terreno: idTerreno,
            },
          },
          data: {
            descripcion:
              dto.descripcion !== undefined
                ? this.normalizeRequiredText(dto.descripcion, 'descripcion')
                : undefined,
            area_aprox_m2: dto.areaAproxM2 ?? undefined,
            estado: dto.estado,
            observaciones: this.normalizeOptionalNullableText(dto.observaciones),
          },
        });
        return this.toResponse(terreno);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async remove(tenantId: bigint, userId: bigint, idTerreno: bigint): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        await tx.terrenos.delete({
          where: {
            id_tenant_id_terreno: {
              id_tenant: tenantId,
              id_terreno: idTerreno,
            },
          },
        });
      } catch (error) {
        this.handleDeleteErrors(error);
        throw error;
      }
    });
  }

  parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('idTerreno debe ser un entero positivo.');
    }
    return BigInt(id);
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
    if (value === undefined || value === null) return null;
    const normalized = value.trim();
    return normalized || null;
  }

  private normalizeOptionalNullableText(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    return this.normalizeNullableText(value);
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException('No se encontro el terreno solicitado.');
    }
  }

  private handleDeleteErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar el terreno porque tiene relaciones asociadas.',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el terreno solicitado.');
      }
    }
  }

  private toResponse(terreno: {
    id_tenant: bigint;
    id_terreno: bigint;
    descripcion: string;
    area_aprox_m2: Prisma.Decimal | null;
    estado: string;
    observaciones: string | null;
  }): TerrenoResponseDto {
    return {
      idTenant: Number(terreno.id_tenant),
      idTerreno: Number(terreno.id_terreno),
      descripcion: terreno.descripcion,
      areaAproxM2: terreno.area_aprox_m2 === null ? null : Number(terreno.area_aprox_m2),
      estado: terreno.estado,
      observaciones: terreno.observaciones,
    };
  }
}
