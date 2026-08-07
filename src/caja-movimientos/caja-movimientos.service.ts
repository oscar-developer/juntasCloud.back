import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnularCajaMovimientoDto } from './dto/anular-caja-movimiento.dto';
import { CajaMovimientoResponseDto } from './dto/caja-movimiento-response.dto';
import { CreateCajaMovimientoDto } from './dto/create-caja-movimiento.dto';
import { PaginatedCajaMovimientosResponseDto } from './dto/paginated-caja-movimientos-response.dto';
import { QueryCajaMovimientosDto } from './dto/query-caja-movimientos.dto';
import { UpdateCajaMovimientoDto } from './dto/update-caja-movimiento.dto';

const cajaMovimientoWithCategoria = Prisma.validator<Prisma.caja_movimientosDefaultArgs>()({
  include: {
    caja_categorias: {
      select: {
        id_categoria_caja: true,
        nombre: true,
        tipo: true,
        activo: true,
      },
    },
  },
});

type CajaMovimientoWithCategoria = Prisma.caja_movimientosGetPayload<
  typeof cajaMovimientoWithCategoria
>;

@Injectable()
export class CajaMovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateCajaMovimientoDto,
  ): Promise<CajaMovimientoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureOptionalReferences(tx, tenantId, dto);
      const categoria = await this.ensureCategoriaCaja(
        tx,
        tenantId,
        BigInt(dto.idCategoriaCaja),
        dto.tipo,
        true,
      );

      const item = await tx.caja_movimientos.create({
        include: cajaMovimientoWithCategoria.include,
        data: {
          id_tenant: tenantId,
          fecha: this.toDate(dto.fecha, 'fecha'),
          tipo: dto.tipo,
          monto: dto.monto,
          id_categoria_caja: categoria.id_categoria_caja,
          id_persona: this.toNullableBigInt(dto.idPersona),
          id_faena: this.toNullableBigInt(dto.idFaena),
          id_asamblea: this.toNullableBigInt(dto.idAsamblea),
          id_bien: this.toNullableBigInt(dto.idBien),
          id_user: userId,
          descripcion: this.nullable(dto.descripcion),
          medio_pago: dto.medioPago,
          doc_referencia: this.nullable(dto.docReferencia),
          observaciones: this.nullable(dto.observaciones),
          created_by_user: userId,
        },
      });

      return this.toResponse(item);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryCajaMovimientosDto,
  ): Promise<CajaMovimientoResponseDto[] | PaginatedCajaMovimientosResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const from = query.from ? this.toDate(query.from, 'from') : undefined;
      const to = query.to ? this.toDate(query.to, 'to') : undefined;
      const where: Prisma.caja_movimientosWhereInput = {
        id_tenant: tenantId,
        fecha: from || to ? { gte: from, lte: to } : undefined,
        tipo: query.tipo,
        id_categoria_caja: query.idCategoriaCaja ? BigInt(query.idCategoriaCaja) : undefined,
        medio_pago: query.medioPago,
        anulado: query.anulado,
        id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
        id_user: query.idUser ? BigInt(query.idUser) : undefined,
      };

      const usePagination = query.page !== undefined && query.limit !== undefined;
      if (!usePagination) {
        const items = await tx.caja_movimientos.findMany({
          include: cajaMovimientoWithCategoria.include,
          where,
          orderBy: { id_movimiento: 'desc' },
        });
        return items.map((item) => this.toResponse(item));
      }

      const page = query.page!;
      const limit = query.limit!;
      const [total, items] = await Promise.all([
        tx.caja_movimientos.count({ where }),
        tx.caja_movimientos.findMany({
          include: cajaMovimientoWithCategoria.include,
          where,
          orderBy: { id_movimiento: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      return {
        items: items.map((item) => this.toResponse(item)),
        total,
        page,
        limit,
      };
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idMovimiento: bigint,
  ): Promise<CajaMovimientoResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.caja_movimientos.findUnique({
        include: cajaMovimientoWithCategoria.include,
        where: {
          id_tenant_id_movimiento: {
            id_tenant: tenantId,
            id_movimiento: idMovimiento,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el movimiento de caja solicitado.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idMovimiento: bigint,
    dto: UpdateCajaMovimientoDto,
  ): Promise<CajaMovimientoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.caja_movimientos.findUnique({
        where: {
          id_tenant_id_movimiento: {
            id_tenant: tenantId,
            id_movimiento: idMovimiento,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro el movimiento de caja solicitado.');
      }
      if (current.anulado) {
        throw new ConflictException('No se puede editar un movimiento de caja anulado.');
      }

      await this.ensureOptionalReferences(tx, tenantId, dto);
      const nextTipo = dto.tipo ?? current.tipo;
      const nextCategoriaId = dto.idCategoriaCaja
        ? BigInt(dto.idCategoriaCaja)
        : current.id_categoria_caja;
      const categoria = await this.ensureCategoriaCaja(
        tx,
        tenantId,
        nextCategoriaId,
        nextTipo,
        dto.idCategoriaCaja !== undefined,
      );

      const item = await tx.caja_movimientos.update({
        include: cajaMovimientoWithCategoria.include,
        where: {
          id_tenant_id_movimiento: {
            id_tenant: tenantId,
            id_movimiento: idMovimiento,
          },
        },
        data: {
          fecha: dto.fecha !== undefined ? this.toDate(dto.fecha, 'fecha') : undefined,
          tipo: dto.tipo,
          monto: dto.monto,
          id_categoria_caja: dto.idCategoriaCaja !== undefined ? categoria.id_categoria_caja : undefined,
          id_persona: this.toOptionalBigInt(dto.idPersona),
          id_faena: this.toOptionalBigInt(dto.idFaena),
          id_asamblea: this.toOptionalBigInt(dto.idAsamblea),
          id_bien: this.toOptionalBigInt(dto.idBien),
          descripcion: dto.descripcion !== undefined ? this.nullable(dto.descripcion) : undefined,
          medio_pago: dto.medioPago,
          doc_referencia:
            dto.docReferencia !== undefined ? this.nullable(dto.docReferencia) : undefined,
          observaciones:
            dto.observaciones !== undefined ? this.nullable(dto.observaciones) : undefined,
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
    idMovimiento: bigint,
    dto: AnularCajaMovimientoDto,
  ): Promise<CajaMovimientoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.caja_movimientos.findUnique({
        where: {
          id_tenant_id_movimiento: {
            id_tenant: tenantId,
            id_movimiento: idMovimiento,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro el movimiento de caja solicitado.');
      }
      if (current.anulado) {
        throw new ConflictException('El movimiento de caja ya se encuentra anulado.');
      }

      const item = await tx.caja_movimientos.update({
        include: cajaMovimientoWithCategoria.include,
        where: {
          id_tenant_id_movimiento: {
            id_tenant: tenantId,
            id_movimiento: idMovimiento,
          },
        },
        data: {
          anulado: true,
          anulado_at: new Date(),
          anulado_by_user: userId,
          motivo_anulacion: this.required(dto.motivoAnulacion, 'motivoAnulacion'),
          updated_at: new Date(),
          updated_by_user: userId,
        },
      });

      return this.toResponse(item);
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idMovimiento debe ser un entero positivo.');
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

  private async ensureOptionalReferences(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    dto: Pick<CreateCajaMovimientoDto, 'idPersona' | 'idFaena' | 'idAsamblea' | 'idBien'>,
  ): Promise<void> {
    if (dto.idPersona !== undefined && dto.idPersona !== null) {
      const exists = await tx.personas.findUnique({
        where: { id_tenant_id_persona: { id_tenant: tenantId, id_persona: BigInt(dto.idPersona) } },
        select: { id_persona: true },
      });
      if (!exists) {
        throw new NotFoundException('La persona indicada no existe en el tenant activo.');
      }
    }

    if (dto.idFaena !== undefined && dto.idFaena !== null) {
      const exists = await tx.faenas.findUnique({
        where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: BigInt(dto.idFaena) } },
        select: { id_faena: true },
      });
      if (!exists) {
        throw new NotFoundException('La faena indicada no existe en el tenant activo.');
      }
    }

    if (dto.idAsamblea !== undefined && dto.idAsamblea !== null) {
      const exists = await tx.asambleas.findUnique({
        where: {
          id_tenant_id_asamblea: {
            id_tenant: tenantId,
            id_asamblea: BigInt(dto.idAsamblea),
          },
        },
        select: { id_asamblea: true },
      });
      if (!exists) {
        throw new NotFoundException('La asamblea indicada no existe en el tenant activo.');
      }
    }

    if (dto.idBien !== undefined && dto.idBien !== null) {
      const exists = await tx.bienes.findUnique({
        where: { id_tenant_id_bien: { id_tenant: tenantId, id_bien: BigInt(dto.idBien) } },
        select: { id_bien: true },
      });
      if (!exists) {
        throw new NotFoundException('El bien indicado no existe en el tenant activo.');
      }
    }
  }

  private async ensureCategoriaCaja(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    categoriaId: bigint,
    tipo: string,
    requireActive: boolean,
  ): Promise<{ id_categoria_caja: bigint; nombre: string; tipo: string; activo: boolean }> {
    const categoria = await tx.caja_categorias.findUnique({
      where: {
        id_tenant_id_categoria_caja: {
          id_tenant: tenantId,
          id_categoria_caja: categoriaId,
        },
      },
      select: {
        id_categoria_caja: true,
        nombre: true,
        tipo: true,
        activo: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('La categoria de caja indicada no existe en el tenant activo.');
    }
    if (requireActive && !categoria.activo) {
      throw new ConflictException('La categoria de caja indicada se encuentra inactiva.');
    }
    if (categoria.tipo !== tipo) {
      throw new BadRequestException(
        'La categoria de caja indicada no corresponde al tipo de movimiento seleccionado.',
      );
    }

    return categoria;
  }

  private required(value: string, field: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
    return normalized;
  }

  private nullable(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const normalized = value.trim();
    return normalized || null;
  }

  private toNullableBigInt(value?: number | null): bigint | null {
    if (value === undefined || value === null) {
      return null;
    }
    return BigInt(value);
  }

  private toOptionalBigInt(value?: number | null): bigint | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.toNullableBigInt(value);
  }

  private toDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} no tiene formato valido.`);
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private toResponse(item: CajaMovimientoWithCategoria): CajaMovimientoResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idMovimiento: Number(item.id_movimiento),
      fecha: item.fecha,
      tipo: item.tipo,
      monto: Number(item.monto),
      idCategoriaCaja: Number(item.id_categoria_caja),
      categoriaNombre: item.caja_categorias.nombre,
      idPersona: item.id_persona === null ? null : Number(item.id_persona),
      idFaena: item.id_faena === null ? null : Number(item.id_faena),
      idAsamblea: item.id_asamblea === null ? null : Number(item.id_asamblea),
      idBien: item.id_bien === null ? null : Number(item.id_bien),
      idUser: Number(item.id_user),
      descripcion: item.descripcion,
      medioPago: item.medio_pago,
      docReferencia: item.doc_referencia,
      observaciones: item.observaciones,
      createdAt: item.created_at,
      createdByUser: Number(item.created_by_user),
      updatedAt: item.updated_at,
      updatedByUser: item.updated_by_user === null ? null : Number(item.updated_by_user),
      anulado: item.anulado,
      anuladoAt: item.anulado_at,
      anuladoByUser: item.anulado_by_user === null ? null : Number(item.anulado_by_user),
      motivoAnulacion: item.motivo_anulacion,
    };
  }
}
