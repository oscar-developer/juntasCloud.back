import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { PersonaResponseDto } from './dto/persona-response.dto';
import { QueryPersonasDto } from './dto/query-personas.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreatePersonaDto,
  ): Promise<PersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const persona = await tx.personas.create({
        data: {
          id_tenant: tenantId,
          nombres: this.normalizeRequiredText(dto.nombres, 'nombres'),
          apellidopaterno: this.normalizeRequiredText(dto.apellidoPaterno, 'apellidoPaterno'),
          apellidomaterno: this.normalizeRequiredText(dto.apellidoMaterno, 'apellidoMaterno'),
          dni: this.normalizeNullableText(dto.dni),
          telefono: this.normalizeNullableText(dto.telefono),
          referencia_vivienda: this.normalizeNullableText(dto.referenciaVivienda),
          tipo_participante: dto.tipoParticipante ?? 'NO_PADRONADO',
          estado: dto.estado ?? 'ACTIVO',
          fecha_registro: this.normalizeDate(dto.fechaRegistro),
          observaciones: this.normalizeNullableText(dto.observaciones),
        },
      });

      return this.toResponse(persona);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryPersonasDto,
  ): Promise<PersonaResponseDto[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    return this.withTenantContext(userId, tenantId, async (tx) => {
      const personas = await tx.personas.findMany({
        where: {
          id_tenant: tenantId,
          dni: query.dni?.trim() || undefined,
          estado: query.estado,
          tipo_participante: query.tipoParticipante,
          OR: query.search
            ? [
                { nombres: { contains: query.search.trim(), mode: 'insensitive' } },
                { apellidopaterno: { contains: query.search.trim(), mode: 'insensitive' } },
                { apellidomaterno: { contains: query.search.trim(), mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: { id_persona: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return personas.map((persona) => this.toResponse(persona));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idPersona: bigint,
  ): Promise<PersonaResponseDto> {
    const persona = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.personas.findUnique({
        where: {
          id_tenant_id_persona: {
            id_tenant: tenantId,
            id_persona: idPersona,
          },
        },
      }),
    );

    if (!persona) {
      throw new NotFoundException('No se encontro la persona solicitada.');
    }

    return this.toResponse(persona);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idPersona: bigint,
    dto: UpdatePersonaDto,
  ): Promise<PersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const persona = await tx.personas.update({
          where: {
            id_tenant_id_persona: {
              id_tenant: tenantId,
              id_persona: idPersona,
            },
          },
          data: {
            nombres:
              dto.nombres !== undefined
                ? this.normalizeRequiredText(dto.nombres, 'nombres')
                : undefined,
            apellidopaterno:
              dto.apellidoPaterno !== undefined
                ? this.normalizeRequiredText(dto.apellidoPaterno, 'apellidoPaterno')
                : undefined,
            apellidomaterno:
              dto.apellidoMaterno !== undefined
                ? this.normalizeRequiredText(dto.apellidoMaterno, 'apellidoMaterno')
                : undefined,
            dni: this.normalizeOptionalNullableText(dto.dni),
            telefono: this.normalizeOptionalNullableText(dto.telefono),
            referencia_vivienda: this.normalizeOptionalNullableText(dto.referenciaVivienda),
            tipo_participante: dto.tipoParticipante,
            estado: dto.estado,
            fecha_registro:
              dto.fechaRegistro !== undefined ? this.normalizeDate(dto.fechaRegistro) : undefined,
            observaciones: this.normalizeOptionalNullableText(dto.observaciones),
          },
        });

        return this.toResponse(persona);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async remove(
    tenantId: bigint,
    userId: bigint,
    idPersona: bigint,
  ): Promise<PersonaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const persona = await tx.personas.update({
          where: {
            id_tenant_id_persona: {
              id_tenant: tenantId,
              id_persona: idPersona,
            },
          },
          data: {
            estado: 'RETIRADO',
          },
        });

        return this.toResponse(persona);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  parsePersonaId(idPersona: string): bigint {
    if (!/^\d+$/.test(idPersona)) {
      throw new BadRequestException('idPersona debe ser un numero entero positivo.');
    }
    return BigInt(idPersona);
  }

  private async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
        );
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`,
        );
        await this.getTenantMembershipOrThrow(tx, tenantId, userId);
        return fn(tx);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  private async getTenantMembershipOrThrow(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    userId: bigint,
  ): Promise<void> {
    const membership = await tx.tenant_users.findFirst({
      where: {
        id_tenant: tenantId,
        id_user: userId,
        estado: 'ACTIVO',
      },
      select: { id_user: true },
    });

    if (!membership) {
      throw new ForbiddenException('El usuario no pertenece al tenant activo.');
    }
  }

  private normalizeRequiredText(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} no puede estar vacio.`);
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

  private normalizeDate(value?: string): Date {
    if (!value) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('fechaRegistro no tiene un formato valido.');
    }

    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
    );
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro la persona solicitada.');
      }
    }
  }

  private toResponse(persona: {
    id_tenant: bigint;
    id_persona: bigint;
    nombres: string;
    apellidopaterno: string;
    apellidomaterno: string;
    dni: string | null;
    telefono: string | null;
    referencia_vivienda: string | null;
    tipo_participante: string;
    estado: string;
    fecha_registro: Date;
    observaciones: string | null;
  }): PersonaResponseDto {
    return {
      idTenant: persona.id_tenant.toString(),
      idPersona: persona.id_persona.toString(),
      nombres: persona.nombres,
      apellidoPaterno: persona.apellidopaterno,
      apellidoMaterno: persona.apellidomaterno,
      dni: persona.dni,
      telefono: persona.telefono,
      referenciaVivienda: persona.referencia_vivienda,
      tipoParticipante: persona.tipo_participante,
      estado: persona.estado,
      fechaRegistro: persona.fecha_registro,
      observaciones: persona.observaciones,
    };
  }
}
