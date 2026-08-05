import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCajaCategoriaDto } from './dto/create-caja-categoria.dto';
import { CajaCategoriaResponseDto } from './dto/caja-categoria-response.dto';
import { QueryCajaCategoriasDto } from './dto/query-caja-categorias.dto';
import { UpdateCajaCategoriaDto } from './dto/update-caja-categoria.dto';

@Injectable()
export class CajaCategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateCajaCategoriaDto,
  ): Promise<CajaCategoriaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const item = await tx.caja_categorias.create({
        data: {
          id_tenant: tenantId,
          cod_categoria: this.buildCode(dto.nombre, 'CAT'),
          nombre: this.normalizeRequiredText(dto.nombre, 'nombre'),
          tipo: dto.tipo,
          activo: dto.activo ?? true,
        },
      });

      return this.toResponse(item);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryCajaCategoriasDto,
  ): Promise<CajaCategoriaResponseDto[]> {
    const search = this.normalizeFilterText(query.search);

    return this.withTenantContext(userId, tenantId, async (tx) => {
      const items = await tx.caja_categorias.findMany({
        where: {
          id_tenant: tenantId,
          tipo: query.tipo,
          activo: query.activo,
          OR: search
            ? [{ nombre: { contains: search, mode: 'insensitive' } }]
            : undefined,
        },
        orderBy: { id_categoria_caja: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idCategoriaCaja: bigint,
  ): Promise<CajaCategoriaResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.caja_categorias.findUnique({
        where: {
          id_tenant_id_categoria_caja: {
            id_tenant: tenantId,
            id_categoria_caja: idCategoriaCaja,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro la categoria de caja solicitada.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idCategoriaCaja: bigint,
    dto: UpdateCajaCategoriaDto,
  ): Promise<CajaCategoriaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const item = await tx.caja_categorias.update({
          where: {
            id_tenant_id_categoria_caja: {
              id_tenant: tenantId,
              id_categoria_caja: idCategoriaCaja,
            },
          },
          data: {
            nombre:
              dto.nombre !== undefined
                ? this.normalizeRequiredText(dto.nombre, 'nombre')
                : undefined,
            tipo: dto.tipo,
            activo: dto.activo,
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
    idCategoriaCaja: bigint,
  ): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        await tx.caja_categorias.delete({
          where: {
            id_tenant_id_categoria_caja: {
              id_tenant: tenantId,
              id_categoria_caja: idCategoriaCaja,
            },
          },
        });
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('idCategoriaCaja debe ser un entero positivo.');
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
          'No se puede eliminar la categoria de caja porque tiene movimientos relacionados.',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro la categoria de caja solicitada.');
      }
    }
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_categoria_caja: bigint;
    nombre: string;
    tipo: string;
    activo: boolean;
  }): CajaCategoriaResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idCategoriaCaja: Number(item.id_categoria_caja),
      nombre: item.nombre,
      tipo: item.tipo,
      activo: item.activo,
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
