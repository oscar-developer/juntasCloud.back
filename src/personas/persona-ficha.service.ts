import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryPersonaAsistenciasDto,
  QueryPersonaObligacionesDto,
  QueryPersonaPagosDto,
} from './dto/persona-ficha-query.dto';
import {
  PaginatedPersonaAsistenciasResponseDto,
  PaginatedPersonaObligacionesResponseDto,
  PaginatedPersonaPagosResponseDto,
  PersonaFichaResponseDto,
  PersonaTerrenoFichaDto,
} from './dto/persona-ficha-response.dto';

type JsonTextRow = {
  reporte: string | null;
};

@Injectable()
export class PersonaFichaService {
  constructor(private readonly prisma: PrismaService) {}

  async getFicha(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
  ): Promise<PersonaFichaResponseDto> {
    return this.executePersonaFunction(tenantId, userId, async (tx) =>
      tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`SELECT public.fn_persona_ficha(${tenantId}, ${personaId})::text AS reporte`,
      ),
    );
  }

  async getAsistencias(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
    query: QueryPersonaAsistenciasDto,
  ): Promise<PaginatedPersonaAsistenciasResponseDto> {
    return this.executePersonaFunction(tenantId, userId, async (tx) =>
      tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`
          SELECT public.fn_persona_asistencias(
            ${tenantId},
            ${personaId},
            ${query.tipo ?? null}::varchar,
            ${query.estado ?? null}::varchar,
            ${query.anio ?? null}::int,
            ${query.page ?? 1},
            ${query.limit ?? 20}
          )::text AS reporte
        `,
      ),
    );
  }

  async getObligaciones(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
    query: QueryPersonaObligacionesDto,
  ): Promise<PaginatedPersonaObligacionesResponseDto> {
    return this.executePersonaFunction(tenantId, userId, async (tx) =>
      tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`
          SELECT public.fn_persona_obligaciones(
            ${tenantId},
            ${personaId},
            ${query.estado ?? null}::varchar,
            ${query.page ?? 1},
            ${query.limit ?? 20}
          )::text AS reporte
        `,
      ),
    );
  }

  async getPagos(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
    query: QueryPersonaPagosDto,
  ): Promise<PaginatedPersonaPagosResponseDto> {
    return this.executePersonaFunction(tenantId, userId, async (tx) =>
      tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`
          SELECT public.fn_persona_pagos(
            ${tenantId},
            ${personaId},
            ${query.page ?? 1},
            ${query.limit ?? 20}
          )::text AS reporte
        `,
      ),
    );
  }

  async getTerrenos(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
  ): Promise<PersonaTerrenoFichaDto[]> {
    return this.executePersonaFunction(tenantId, userId, async (tx) =>
      tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`SELECT public.fn_persona_terrenos(${tenantId}, ${personaId})::text AS reporte`,
      ),
    );
  }

  private async executePersonaFunction<T>(
    tenantId: bigint,
    userId: bigint,
    query: (tx: Prisma.TransactionClient) => Promise<JsonTextRow[]>,
  ): Promise<T> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const rows = await query(tx);
        return this.parseFunctionResult<T>(rows[0]?.reporte);
      } catch (error) {
        this.handleFunctionError(error);
        throw error;
      }
    });
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

  private parseFunctionResult<T>(value: string | null | undefined): T {
    if (!value) {
      throw new NotFoundException('No se encontro la persona solicitada.');
    }

    const parsed = JSON.parse(value) as T | null;
    if (parsed === null) {
      throw new NotFoundException('No se encontro la persona solicitada.');
    }

    return parsed;
  }

  private handleFunctionError(error: unknown): void {
    if (
      error instanceof BadRequestException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      const message = error.message ?? '';

      if (message.includes('app.tenant_id') || message.includes('app.user_id')) {
        throw new BadRequestException(
          'No se pudo consultar la ficha porque falta contexto de sesion.',
        );
      }
    }
  }
}
