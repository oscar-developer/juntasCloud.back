import {
  BadRequestException,
  ConflictException,
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
      try {
        const fechaRegistro = this.normalizeDate(dto.fechaRegistro, 'fechaRegistro');
        const fechaBaja = this.normalizeNullableDate(dto.fechaBaja, 'fechaBaja');
        const tipoParticipante = dto.tipoParticipante ?? 'NO_PADRONADO';
        const estado = dto.estado ?? 'ACTIVO';
        const observaciones = this.normalizeNullableText(dto.observaciones);
        const persona = await tx.personas.create({
          data: {
            id_tenant: tenantId,
            nombres: this.normalizeRequiredText(dto.nombres, 'nombres'),
            apellido_paterno: this.normalizeRequiredText(dto.apellidoPaterno, 'apellidoPaterno'),
            apellido_materno: this.normalizeRequiredText(dto.apellidoMaterno, 'apellidoMaterno'),
            dni: this.normalizeNullableText(dto.dni),
            email: this.normalizeNullableEmail(dto.email),
            telefono: this.normalizeNullableText(dto.telefono),
            direccion: this.normalizeNullableText(dto.direccion),
            referencia_vivienda: this.normalizeNullableText(dto.referenciaVivienda),
            tipo_participante: tipoParticipante,
            estado,
            fecha_registro: fechaRegistro,
            fecha_baja: fechaBaja,
            observaciones,
          },
        });

        await this.createPersonaConditionIfSupported(tx, {
          tenantId,
          personaId: persona.id_persona,
          condicion: this.resolveCondition(estado, tipoParticipante),
          fechaInicio: fechaRegistro,
          observaciones,
          userId,
        });

        return this.toResponse(persona);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryPersonasDto,
  ): Promise<PersonaResponseDto[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const dni = this.normalizeFilterText(query.dni);
    const email = this.normalizeFilterEmail(query.email);
    const search = this.normalizeFilterText(query.search);

    return this.withTenantContext(userId, tenantId, async (tx) => {
      const personas = await tx.personas.findMany({
        where: {
          id_tenant: tenantId,
          dni,
          email,
          estado: query.estado,
          tipo_participante: query.tipoParticipante,
          OR: search
            ? [
                { nombres: { contains: search, mode: 'insensitive' } },
                { apellido_paterno: { contains: search, mode: 'insensitive' } },
                { apellido_materno: { contains: search, mode: 'insensitive' } },
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
        const current = await tx.personas.findUnique({
          where: {
            id_tenant_id_persona: {
              id_tenant: tenantId,
              id_persona: idPersona,
            },
          },
          select: {
            id_persona: true,
            tipo_participante: true,
            estado: true,
            fecha_baja: true,
            observaciones: true,
          },
        });

        if (!current) {
          throw new NotFoundException('No se encontro la persona solicitada.');
        }

        const nextTipoParticipante = dto.tipoParticipante ?? current.tipo_participante;
        const nextEstado = dto.estado ?? current.estado;
        const nextFechaBaja =
          dto.fechaBaja !== undefined
            ? this.normalizeOptionalNullableDate(dto.fechaBaja, 'fechaBaja')
            : current.fecha_baja;
        const nextObservaciones =
          dto.observaciones !== undefined
            ? this.normalizeOptionalNullableText(dto.observaciones)
            : current.observaciones;
        const previousCondition = this.resolveCondition(current.estado, current.tipo_participante);
        const nextCondition = this.resolveCondition(nextEstado, nextTipoParticipante);

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
            apellido_paterno:
              dto.apellidoPaterno !== undefined
                ? this.normalizeRequiredText(dto.apellidoPaterno, 'apellidoPaterno')
                : undefined,
            apellido_materno:
              dto.apellidoMaterno !== undefined
                ? this.normalizeRequiredText(dto.apellidoMaterno, 'apellidoMaterno')
                : undefined,
            dni: this.normalizeOptionalNullableText(dto.dni),
            email: this.normalizeOptionalNullableEmail(dto.email),
            telefono: this.normalizeOptionalNullableText(dto.telefono),
            direccion: this.normalizeOptionalNullableText(dto.direccion),
            referencia_vivienda: this.normalizeOptionalNullableText(dto.referenciaVivienda),
            tipo_participante: dto.tipoParticipante,
            estado: dto.estado,
            fecha_registro:
              dto.fechaRegistro !== undefined
                ? this.normalizeDate(dto.fechaRegistro, 'fechaRegistro')
                : undefined,
            fecha_baja: dto.fechaBaja !== undefined ? nextFechaBaja : undefined,
            observaciones: this.normalizeOptionalNullableText(dto.observaciones),
            updated_at: new Date(),
          },
        });

        await this.syncPersonaConditionHistory(tx, {
          tenantId,
          personaId: idPersona,
          previousCondition,
          nextCondition,
          effectiveDate: this.resolveConditionEffectiveDate(nextCondition, nextFechaBaja ?? null),
          observaciones: nextObservaciones ?? null,
          userId,
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
        const current = await tx.personas.findUnique({
          where: {
            id_tenant_id_persona: {
              id_tenant: tenantId,
              id_persona: idPersona,
            },
          },
          select: {
            fecha_baja: true,
            tipo_participante: true,
            estado: true,
            observaciones: true,
          },
        });

        if (!current) {
          throw new NotFoundException('No se encontro la persona solicitada.');
        }

        const fechaBaja = current.fecha_baja ?? this.today();
        const previousCondition = this.resolveCondition(current.estado, current.tipo_participante);

        const persona = await tx.personas.update({
          where: {
            id_tenant_id_persona: {
              id_tenant: tenantId,
              id_persona: idPersona,
            },
          },
          data: {
            estado: 'RETIRADO',
            fecha_baja: fechaBaja,
            updated_at: new Date(),
          },
        });

        await this.syncPersonaConditionHistory(tx, {
          tenantId,
          personaId: idPersona,
          previousCondition,
          nextCondition: 'RETIRADO',
          effectiveDate: fechaBaja,
          observaciones: current.observaciones,
          userId,
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

  private normalizeEmail(email: string, fieldName: string): string {
    if (typeof email !== 'string') {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }
    return normalized;
  }

  private normalizeNullableEmail(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.trim();
    return normalized ? this.normalizeEmail(normalized, 'email') : null;
  }

  private normalizeOptionalNullableEmail(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.normalizeNullableEmail(value);
  }

  private normalizeFilterText(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
  }

  private normalizeFilterEmail(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized ? this.normalizeEmail(normalized, 'email') : undefined;
  }

  private normalizeDate(value: string | undefined, fieldName: string): Date {
    if (!value) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} no tiene un formato valido.`);
    }

    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
    );
  }

  private normalizeNullableDate(value: string | null | undefined, fieldName: string): Date | null {
    if (value === undefined || value === null) {
      return null;
    }
    return this.normalizeDate(value, fieldName);
  }

  private normalizeOptionalNullableDate(
    value: string | null | undefined,
    fieldName: string,
  ): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return this.normalizeDate(value, fieldName);
  }

  private today(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private resolveCondition(
    estado: string,
    tipoParticipante: string,
  ): 'PADRONADO' | 'NO_PADRONADO' | 'INVITADO' | 'SUSPENDIDO' | 'RETIRADO' | 'FALLECIDO' | null {
    if (estado === 'SUSPENDIDO' || estado === 'RETIRADO'|| estado === 'FALLECIDO') {
      return estado;
    }
    if (
      tipoParticipante === 'PADRONADO' ||
      tipoParticipante === 'NO_PADRONADO' ||
      tipoParticipante === 'INVITADO'
    ) {
      return tipoParticipante;
    }
    return null;
  }

  private resolveConditionEffectiveDate(
    nextCondition: string | null,
    fechaBaja: Date | null,
  ): Date {
    if (nextCondition === 'RETIRADO' && fechaBaja !== null) {
      return fechaBaja;
    }
    return this.today();
  }

  private async syncPersonaConditionHistory(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: bigint;
      personaId: bigint;
      previousCondition: string | null;
      nextCondition: string | null;
      effectiveDate: Date;
      observaciones: string | null;
      userId: bigint;
    },
  ): Promise<void> {
    if (input.previousCondition === input.nextCondition) {
      return;
    }

    await this.closeActivePersonaCondition(
      tx,
      input.tenantId,
      input.personaId,
      input.effectiveDate,
    );

    await this.createPersonaConditionIfSupported(tx, {
      tenantId: input.tenantId,
      personaId: input.personaId,
      condicion: input.nextCondition,
      fechaInicio: input.effectiveDate,
      observaciones: input.observaciones,
      userId: input.userId,
    });
  }

  private async closeActivePersonaCondition(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    personaId: bigint,
    fechaFin: Date,
  ): Promise<void> {
    await tx.persona_condiciones.updateMany({
      where: {
        id_tenant: tenantId,
        id_persona: personaId,
        fecha_fin: null,
      },
      data: {
        fecha_fin: fechaFin,
      },
    });
  }

  private async createPersonaConditionIfSupported(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: bigint;
      personaId: bigint;
      condicion: string | null;
      fechaInicio: Date;
      observaciones: string | null;
      userId: bigint;
    },
  ): Promise<void> {
    if (input.condicion === null) {
      return;
    }

    await tx.persona_condiciones.create({
      data: {
        id_tenant: input.tenantId,
        id_persona: input.personaId,
        condicion: input.condicion,
        fecha_inicio: input.fechaInicio,
        fecha_fin: null,
        observaciones: input.observaciones,
        created_by_user: input.userId,
      },
    });
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una persona con ese DNI en el tenant activo.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro la persona solicitada.');
      }
    }
  }

  private toResponse(persona: {
    id_tenant: bigint;
    id_persona: bigint;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    dni: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    referencia_vivienda: string | null;
    tipo_participante: string;
    estado: string;
    fecha_registro: Date;
    fecha_baja: Date | null;
    observaciones: string | null;
  }): PersonaResponseDto {
    return {
      idTenant: Number(persona.id_tenant),
      idPersona: Number(persona.id_persona),
      nombres: persona.nombres,
      apellidoPaterno: persona.apellido_paterno,
      apellidoMaterno: persona.apellido_materno,
      dni: persona.dni,
      email: persona.email,
      telefono: persona.telefono,
      direccion: persona.direccion,
      referenciaVivienda: persona.referencia_vivienda,
      tipoParticipante: persona.tipo_participante,
      estado: persona.estado,
      fechaRegistro: persona.fecha_registro,
      fechaBaja: persona.fecha_baja,
      observaciones: persona.observaciones,
    };
  }
}
