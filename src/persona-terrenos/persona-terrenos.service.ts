import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonaTerrenoDto } from './dto/create-persona-terreno.dto';
import { PersonaTerrenoResponseDto } from './dto/persona-terreno-response.dto';
import { QueryPersonaTerrenosDto } from './dto/query-persona-terrenos.dto';
import { UpdatePersonaTerrenoDto } from './dto/update-persona-terreno.dto';

@Injectable()
export class PersonaTerrenosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreatePersonaTerrenoDto,
  ): Promise<PersonaTerrenoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const idPersona = BigInt(dto.idPersona);
      const idTerreno = BigInt(dto.idTerreno);
      await this.ensurePersonaExists(tx, tenantId, idPersona);
      await this.ensureTerrenoExists(tx, tenantId, idTerreno);
      try {
        const item = await tx.persona_terreno.create({
          data: {
            id_tenant: tenantId,
            id_persona: idPersona,
            id_terreno: idTerreno,
            tipo_relacion: dto.tipoRelacion,
            porcentaje_participacion: dto.porcentajeParticipacion ?? null,
          },
        });
        return this.toResponse(item);
      } catch (error) {
        this.handlePrismaError(error);
      }
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryPersonaTerrenosDto,
  ): Promise<PersonaTerrenoResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) =>
      (
        await tx.persona_terreno.findMany({
          where: {
            id_tenant: tenantId,
            id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
            id_terreno: query.idTerreno ? BigInt(query.idTerreno) : undefined,
            tipo_relacion: query.tipoRelacion,
          },
          orderBy: { id_persona_terreno: 'desc' },
        })
      ).map((item) => this.toResponse(item)),
    );
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idPersonaTerreno: bigint,
  ): Promise<PersonaTerrenoResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.persona_terreno.findUnique({
        where: {
          id_tenant_id_persona_terreno: {
            id_tenant: tenantId,
            id_persona_terreno: idPersonaTerreno,
          },
        },
      }),
    );
    if (!item) {
      throw new NotFoundException('No se encontro la relacion persona-terreno solicitada.');
    }
    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idPersonaTerreno: bigint,
    dto: UpdatePersonaTerrenoDto,
  ): Promise<PersonaTerrenoResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.persona_terreno.findUnique({
        where: {
          id_tenant_id_persona_terreno: {
            id_tenant: tenantId,
            id_persona_terreno: idPersonaTerreno,
          },
        },
      });
      if (!current) {
        throw new NotFoundException('No se encontro la relacion persona-terreno solicitada.');
      }
      const item = await tx.persona_terreno.update({
        where: {
          id_tenant_id_persona_terreno: {
            id_tenant: tenantId,
            id_persona_terreno: idPersonaTerreno,
          },
        },
        data: {
          tipo_relacion: dto.tipoRelacion,
          porcentaje_participacion:
            dto.porcentajeParticipacion !== undefined ? dto.porcentajeParticipacion : undefined,
        },
      });
      return this.toResponse(item);
    });
  }

  async remove(tenantId: bigint, userId: bigint, idPersonaTerreno: bigint): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.persona_terreno.findUnique({
        where: {
          id_tenant_id_persona_terreno: {
            id_tenant: tenantId,
            id_persona_terreno: idPersonaTerreno,
          },
        },
        select: { id_persona_terreno: true },
      });
      if (!current) {
        throw new NotFoundException('No se encontro la relacion persona-terreno solicitada.');
      }
      await tx.persona_terreno.delete({
        where: {
          id_tenant_id_persona_terreno: {
            id_tenant: tenantId,
            id_persona_terreno: idPersonaTerreno,
          },
        },
      });
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idPersonaTerreno debe ser un entero positivo.');
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

  private async ensureTerrenoExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idTerreno: bigint,
  ): Promise<void> {
    const exists = await tx.terrenos.findUnique({
      where: { id_tenant_id_terreno: { id_tenant: tenantId, id_terreno: idTerreno } },
      select: { id_terreno: true },
    });
    if (!exists) {
      throw new NotFoundException('El terreno indicado no existe en el tenant activo.');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('La relacion persona-terreno ya existe en este tenant.');
    }
    throw error;
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_persona_terreno: bigint;
    id_persona: bigint;
    id_terreno: bigint;
    tipo_relacion: string;
    porcentaje_participacion: Prisma.Decimal | null;
  }): PersonaTerrenoResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idPersonaTerreno: Number(item.id_persona_terreno),
      idPersona: Number(item.id_persona),
      idTerreno: Number(item.id_terreno),
      tipoRelacion: item.tipo_relacion,
      porcentajeParticipacion:
        item.porcentaje_participacion === null ? null : Number(item.porcentaje_participacion),
    };
  }
}
