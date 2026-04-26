import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto, userId: bigint): Promise<TenantResponseDto> {
    this.ensureEstadoIsValid(dto.estado);
    const nombre = this.normalizeRequiredText(dto.nombre, 'nombre');
    const tipoDocumento = this.normalizeOptionalText(dto.tipoDocumento, 'tipoDocumento');
    const numeroDocumento = this.normalizeOptionalText(dto.numeroDocumento, 'numeroDocumento');
    const observaciones = this.normalizeOptionalText(dto.observaciones, 'observaciones');

    try {
      return await this.withUserContext(userId, async (tx) => {
        const tenant = await tx.tenants.create({
          data: {
            nombre,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            estado: dto.estado ?? 'ACTIVO',
            observaciones,
            owner_user_id: userId,
          },
          select: this.tenantSelect(),
        });

        await tx.tenant_users.create({
          data: {
            id_tenant: tenant.id_tenant,
            id_user: userId,
            role: 'OWNER',
            estado: 'ACTIVO',
            invited_by: null,
          },
        });

        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.tenant_id', ${tenant.id_tenant.toString()}, true)`,
        );

        await this.seedTenantBaseCatalogs(tx, tenant.id_tenant);

        return this.toResponse(tenant);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async findAll(query: QueryTenantsDto, userId: bigint): Promise<TenantResponseDto[]> {
    this.ensureEstadoIsValid(query.estado);

    const nombre = this.normalizeFilterText(query.nombre);
    const skip = this.normalizeSkip(query.skip);
    const take = this.normalizeTake(query.take);

    const tenants = await this.withUserContext(userId, (tx) =>
      tx.tenants.findMany({
        select: this.tenantSelect(),
        where: {
          nombre: nombre
            ? {
                contains: nombre,
                mode: 'insensitive',
              }
            : undefined,
          estado: query.estado,
        },
        orderBy: { id_tenant: 'desc' },
        skip,
        take,
      }),
    );

    return tenants.map((tenant) => this.toResponse(tenant));
  }

  async findOne(id: bigint, userId: bigint): Promise<TenantResponseDto> {
    const tenant = await this.withUserContext(userId, (tx) =>
      tx.tenants.findUnique({
        select: this.tenantSelect(),
        where: { id_tenant: id },
      }),
    );

    if (!tenant) {
      throw new NotFoundException(`No existe tenant con id ${id.toString()}`);
    }

    return this.toResponse(tenant);
  }

  async update(id: bigint, dto: UpdateTenantDto, userId: bigint): Promise<TenantResponseDto> {
    this.ensureEstadoIsValid(dto.estado);
    const nombre = this.normalizeOptionalText(dto.nombre, 'nombre');
    const tipoDocumento = this.normalizeNullableOptionalText(dto.tipoDocumento, 'tipoDocumento');
    const numeroDocumento = this.normalizeNullableOptionalText(
      dto.numeroDocumento,
      'numeroDocumento',
    );
    const observaciones = this.normalizeNullableOptionalText(
      dto.observaciones,
      'observaciones',
    );

    try {
      const tenant = await this.withUserContext(userId, async (tx) => {
        await this.ensureOwnerAccess(tx, id, userId);

        return tx.tenants.update({
          select: this.tenantSelect(),
          where: { id_tenant: id },
          data: {
            nombre: nombre ?? undefined,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            estado: dto.estado,
            observaciones,
            updated_at: new Date(),
          },
        });
      });

      return this.toResponse(tenant);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async remove(id: bigint, userId: bigint): Promise<void> {
    try {
      await this.withUserContext(userId, async (tx) => {
        await this.ensureOwnerAccess(tx, id, userId);

        await tx.tenants.update({
          where: { id_tenant: id },
          data: {
            estado: 'INACTIVO',
            updated_at: new Date(),
          },
        });
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('El id_tenant debe ser un numero entero positivo.');
    }
    return BigInt(id);
  }

  private async withUserContext<T>(
    userId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
      );
      return fn(tx);
    });
  }

  private async seedTenantBaseCatalogs(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
  ): Promise<void> {
    const [conceptosBase, categoriasBase] = await Promise.all([
      tx.conceptos_cobro_base.findMany({
        orderBy: { id_concepto_cobro_base: 'asc' },
      }),
      tx.caja_categorias_base.findMany({
        orderBy: { id_categoria_caja_base: 'asc' },
      }),
    ]);

    if (conceptosBase.length > 0) {
      await tx.conceptos_cobro.createMany({
        data: conceptosBase.map((concepto) => ({
          id_tenant: tenantId,
          nombre: concepto.nombre,
          tipo: concepto.tipo,
          activo: concepto.activo,
          requiere_periodo: concepto.requiere_periodo,
          observaciones: concepto.observaciones,
        })),
      });
    }

    if (categoriasBase.length > 0) {
      await tx.caja_categorias.createMany({
        data: categoriasBase.map((categoria) => ({
          id_tenant: tenantId,
          nombre: categoria.nombre,
          tipo: categoria.tipo,
          activo: categoria.activo,
        })),
      });
    }
  }

  private normalizeSkip(skip?: number): number {
    if (skip === undefined || skip === null) {
      return 0;
    }
    if (!Number.isInteger(skip) || skip < 0) {
      throw new BadRequestException('skip debe ser un entero mayor o igual a 0.');
    }
    return skip;
  }

  private normalizeTake(take?: number): number {
    if (take === undefined || take === null) {
      return 20;
    }
    if (!Number.isInteger(take) || take < 1 || take > 100) {
      throw new BadRequestException('take debe ser un entero entre 1 y 100.');
    }
    return take;
  }

  private ensureEstadoIsValid(estado?: string): void {
    if (estado === undefined) {
      return;
    }
    if (estado !== 'ACTIVO' && estado !== 'INACTIVO') {
      throw new BadRequestException('estado solo admite ACTIVO o INACTIVO.');
    }
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un tenant con ese nombre para el owner actual.',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el tenant solicitado.');
      }
    }
  }

  private async ensureOwnerAccess(
    tx: Prisma.TransactionClient,
    id: bigint,
    userId: bigint,
  ): Promise<void> {
    const tenant = await tx.tenants.findUnique({
      where: { id_tenant: id },
      select: {
        id_tenant: true,
        owner_user_id: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`No existe tenant con id ${id.toString()}`);
    }

    if (tenant.owner_user_id !== userId) {
      throw new ForbiddenException(
        'Solo el owner del tenant puede actualizarlo o eliminarlo.',
      );
    }
  }

  private tenantSelect() {
    return {
      id_tenant: true,
      nombre: true,
      tipo_documento: true,
      numero_documento: true,
      estado: true,
      created_at: true,
      observaciones: true,
      owner_user_id: true,
    } satisfies Prisma.tenantsSelect;
  }

  private normalizeFilterText(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
  }

  private normalizeOptionalText(
    value: string | null | undefined,
    field: string,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return this.normalizeRequiredText(value, field);
  }

  private normalizeNullableOptionalText(
    value: string | null | undefined,
    field: string,
  ): string | null | undefined {
    return this.normalizeOptionalText(value, field);
  }

  private normalizeRequiredText(value: string, field: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} no puede estar vacio.`);
    }
    return normalized;
  }

  private toResponse(tenant: {
    id_tenant: bigint;
    nombre: string;
    tipo_documento: string | null;
    numero_documento: string | null;
    estado: string;
    created_at: Date;
    observaciones: string | null;
    owner_user_id: bigint;
  }): TenantResponseDto {
    return {
      idTenant: Number(tenant.id_tenant),
      nombre: tenant.nombre,
      tipoDocumento: tenant.tipo_documento,
      numeroDocumento: tenant.numero_documento,
      estado: tenant.estado,
      createdAt: tenant.created_at,
      observaciones: tenant.observaciones,
      ownerUserId: Number(tenant.owner_user_id),
    };
  }
}
