import {
  BadRequestException,
  ConflictException,
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

    try {
      return await this.withUserContext(userId, async (tx) => {
        const tenant = await tx.tenants.create({
          data: {
            nombre: dto.nombre,
            ruc: dto.ruc ?? null,
            dni: dto.dni ?? null,
            estado: dto.estado ?? 'ACTIVO',
            observaciones: dto.observaciones ?? null,
            owner_user_id: userId,
          },
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

        return this.toResponse(tenant);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async findAll(query: QueryTenantsDto, userId: bigint): Promise<TenantResponseDto[]> {
    this.ensureEstadoIsValid(query.estado);

    const skip = this.normalizeSkip(query.skip);
    const take = this.normalizeTake(query.take);

    const tenants = await this.withUserContext(userId, (tx) =>
      tx.tenants.findMany({
        where: {
          nombre: query.nombre
            ? {
                contains: query.nombre,
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

    try {
      const tenant = await this.withUserContext(userId, (tx) =>
        tx.tenants.update({
          where: { id_tenant: id },
          data: {
            nombre: dto.nombre,
            ruc: dto.ruc,
            dni: dto.dni,
            estado: dto.estado,
            observaciones: dto.observaciones,
          },
        }),
      );

      return this.toResponse(tenant);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async remove(id: bigint, userId: bigint): Promise<void> {
    try {
      await this.withUserContext(userId, (tx) =>
        tx.tenants.delete({
          where: { id_tenant: id },
        }),
      );
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
        throw new ConflictException('Ya existe un tenant con ese nombre.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('El usuario del token no existe en auth_users.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el tenant solicitado.');
      }
    }
  }

  private toResponse(tenant: {
    id_tenant: bigint;
    nombre: string;
    ruc: string | null;
    dni: string | null;
    estado: string;
    created_at: Date;
    observaciones: string | null;
    owner_user_id: bigint | null;
  }): TenantResponseDto {
    return {
      idTenant: tenant.id_tenant.toString(),
      nombre: tenant.nombre,
      ruc: tenant.ruc,
      dni: tenant.dni,
      estado: tenant.estado,
      createdAt: tenant.created_at,
      observaciones: tenant.observaciones,
      ownerUserId: tenant.owner_user_id?.toString() ?? null,
    };
  }
}
