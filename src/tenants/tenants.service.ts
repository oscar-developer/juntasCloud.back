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

type TenantWithOwner = {
  id_tenant: bigint;
  nombre: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  estado: string;
  created_at: Date;
  observaciones: string | null;
  tenant_users: { id_user: bigint }[];
};

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto, userId: bigint): Promise<TenantResponseDto> {
    this.ensureEstadoIsValid(dto.estado);
    const nombre = this.normalizeRequiredText(dto.nombre, 'nombre');
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
      return await this.withUserContext(userId, async (tx) => {
        const rows = await tx.$queryRaw<{ id_tenant: bigint }[]>(
          Prisma.sql`
            SELECT public.create_tenant(
              ${nombre},
              ${tipoDocumento},
              ${numeroDocumento},
              ${observaciones}
            ) AS id_tenant
          `,
        );
        const tenantId = rows[0]?.id_tenant;
        if (!tenantId) {
          throw new BadRequestException('No se pudo crear el tenant.');
        }

        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`,
        );

        const tenant = await this.findTenantById(tx, tenantId);
        return this.toResponse(tenant);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      this.handleFunctionErrors(error);
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
    const nombre =
      dto.nombre !== undefined ? this.normalizeRequiredText(dto.nombre, 'nombre') : undefined;
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
      const tenant = await this.withTenantContext(userId, id, (tx) =>
        tx.tenants.update({
          select: this.tenantSelect(),
          where: { id_tenant: id },
          data: {
            nombre,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            estado: dto.estado,
            observaciones,
          },
        }),
      );

      return this.toResponse(tenant);
    } catch (error) {
      this.handleKnownErrors(error);
      this.handleFunctionErrors(error);
      throw error;
    }
  }

  async remove(id: bigint, userId: bigint): Promise<void> {
    try {
      await this.withTenantContext(userId, id, (tx) =>
        tx.$queryRaw(Prisma.sql`SELECT public.enviar_tenant_a_papelera(${id})`),
      );
    } catch (error) {
      this.handleFunctionErrors(error);
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async removePermanent(id: bigint, userId: bigint): Promise<void> {
    try {
      await this.withTenantContext(userId, id, (tx) =>
        tx.$queryRaw(
          Prisma.sql`
            SELECT public.eliminar_tenant_definitivamente(
              ${id},
              ${'ELIMINAR DEFINITIVAMENTE'}
            )
          `,
        ),
      );
    } catch (error) {
      this.handleFunctionErrors(error);
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
    return this.prisma.withUserContext(userId, fn);
  }

  private async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.withTenantContext(userId, tenantId, fn);
  }

  private async findTenantById(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
  ): Promise<TenantWithOwner> {
    const tenant = await tx.tenants.findUnique({
      select: this.tenantSelect(),
      where: { id_tenant: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('No se encontro el tenant creado.');
    }

    return tenant;
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
    if (estado !== 'ACTIVO' && estado !== 'INACTIVO' && estado !== 'SUSPENDIDO') {
      throw new BadRequestException('estado solo admite ACTIVO, INACTIVO o SUSPENDIDO.');
    }
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un registro que viola una regla unica.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el tenant solicitado.');
      }
    }
  }

  private handleFunctionErrors(error: unknown): void {
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('correo verificado')) {
        throw new ForbiddenException('El usuario debe estar activo y tener el correo verificado.');
      }
      if (message.includes('OWNER') || message.includes('permiso')) {
        throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
      }
      if (message.includes('papelera')) {
        throw new ConflictException(
          'El tenant debe estar en la papelera antes de eliminarse definitivamente.',
        );
      }
      if (message.includes('no existe') || message.includes('no encontrado')) {
        throw new NotFoundException('No se encontro el tenant solicitado.');
      }
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
      tenant_users: {
        where: {
          role: 'OWNER',
          estado: 'ACTIVO',
        },
        select: {
          id_user: true,
        },
        take: 1,
      },
    } satisfies Prisma.tenantsSelect;
  }

  private normalizeFilterText(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
  }

  private normalizeNullableOptionalText(
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

  private toResponse(tenant: TenantWithOwner): TenantResponseDto {
    const owner = tenant.tenant_users[0];
    return {
      idTenant: Number(tenant.id_tenant),
      nombre: tenant.nombre,
      tipoDocumento: tenant.tipo_documento,
      numeroDocumento: tenant.numero_documento,
      estado: tenant.estado,
      createdAt: tenant.created_at,
      observaciones: tenant.observaciones,
      ownerUserId: owner ? Number(owner.id_user) : null,
    };
  }
}
