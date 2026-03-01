import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnularFaenaParticipacionDto } from './dto/anular-faena-participacion.dto';
import { CreateFaenaParticipacionDto } from './dto/create-faena-participacion.dto';
import { FaenaParticipacionResponseDto } from './dto/faena-participacion-response.dto';
import { QueryFaenaParticipacionesDto } from './dto/query-faena-participaciones.dto';
import { UpdateFaenaParticipacionDto } from './dto/update-faena-participacion.dto';

@Injectable()
export class FaenaParticipacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    idFaena: bigint,
    dto: CreateFaenaParticipacionDto,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureFaenaExists(tx, tenantId, idFaena);
      await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));

      const payload = this.resolveFine(dto.multaGenerada, dto.montoMulta, undefined);

      try {
        const item = await tx.faena_participacion.create({
          data: {
            id_tenant: tenantId,
            id_faena: idFaena,
            id_persona: BigInt(dto.idPersona),
            estado: dto.estado ?? 'PENDIENTE',
            hora_llegada: this.optionalTime(dto.horaLlegada, 'horaLlegada'),
            cant_personas_extra: dto.cantPersonasExtra ?? 0,
            multa_generada: payload.multaGenerada ?? false,
            monto_multa: payload.montoMulta ?? null,
            observaciones: this.nullable(dto.observaciones),
            created_by_user: userId,
          },
        });

        return this.toResponse(item);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('La participacion de la persona en la faena ya existe.');
        }
        throw error;
      }
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    idFaena: bigint,
    query: QueryFaenaParticipacionesDto,
  ): Promise<FaenaParticipacionResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureFaenaExists(tx, tenantId, idFaena);

      const items = await tx.faena_participacion.findMany({
        where: {
          id_tenant: tenantId,
          id_faena: idFaena,
          estado: query.estado,
          anulado: query.anulado,
          id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
        },
        orderBy: { id_faena_participacion: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idFaenaParticipacion: bigint,
  ): Promise<FaenaParticipacionResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.faena_participacion.findUnique({
        where: {
          id_tenant_id_faena_participacion: {
            id_tenant: tenantId,
            id_faena_participacion: idFaenaParticipacion,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro la participacion de faena solicitada.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idFaenaParticipacion: bigint,
    dto: UpdateFaenaParticipacionDto,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.faena_participacion.findUnique({
        where: {
          id_tenant_id_faena_participacion: {
            id_tenant: tenantId,
            id_faena_participacion: idFaenaParticipacion,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la participacion de faena solicitada.');
      }
      if (current.anulado) {
        throw new ConflictException('No se puede editar una participacion anulada.');
      }
      if (dto.idPersona !== undefined) {
        throw new BadRequestException('idPersona no se puede editar en este endpoint.');
      }

      const payload = this.resolveFine(dto.multaGenerada, dto.montoMulta, {
        multaGenerada: current.multa_generada,
        montoMulta: current.monto_multa,
      });

      const item = await tx.faena_participacion.update({
        where: {
          id_tenant_id_faena_participacion: {
            id_tenant: tenantId,
            id_faena_participacion: idFaenaParticipacion,
          },
        },
        data: {
          estado: dto.estado,
          hora_llegada:
            dto.horaLlegada !== undefined
              ? this.optionalTime(dto.horaLlegada, 'horaLlegada')
              : undefined,
          cant_personas_extra: dto.cantPersonasExtra,
          multa_generada: payload.multaGenerada,
          monto_multa: payload.montoMulta,
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
    idFaenaParticipacion: bigint,
    dto: AnularFaenaParticipacionDto,
  ): Promise<FaenaParticipacionResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.faena_participacion.findUnique({
        where: {
          id_tenant_id_faena_participacion: {
            id_tenant: tenantId,
            id_faena_participacion: idFaenaParticipacion,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la participacion de faena solicitada.');
      }
      if (current.anulado) {
        throw new ConflictException('La participacion de faena ya se encuentra anulada.');
      }

      const item = await tx.faena_participacion.update({
        where: {
          id_tenant_id_faena_participacion: {
            id_tenant: tenantId,
            id_faena_participacion: idFaenaParticipacion,
          },
        },
        data: {
          anulado: true,
          anulado_at: new Date(),
          anulado_by_user: userId,
          motivo_anulacion: this.required(dto.motivoAnulacion, 'motivoAnulacion'),
        },
      });

      return this.toResponse(item);
    });
  }

  parseId(value: string, field = 'idFaenaParticipacion'): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
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

  private async ensureFaenaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idFaena: bigint,
  ): Promise<void> {
    const exists = await tx.faenas.findUnique({
      where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: idFaena } },
      select: { id_faena: true },
    });
    if (!exists) {
      throw new NotFoundException('La faena indicada no existe en el tenant activo.');
    }
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

  private optionalTime(value: string | null | undefined, field: string): Date | null {
    if (value === undefined || value === null) return null;
    return this.toTime(value, field);
  }

  private toTime(value: string, field: string): Date {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) {
      throw new BadRequestException(`${field} debe tener formato HH:mm o HH:mm:ss.`);
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] ?? '0');
    if (hours > 23 || minutes > 59 || seconds > 59) {
      throw new BadRequestException(`${field} no tiene una hora valida.`);
    }
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
  }

  private resolveFine(
    multaGeneradaInput: boolean | undefined,
    montoMultaInput: number | null | undefined,
    current?: { multaGenerada: boolean; montoMulta: Prisma.Decimal | null },
  ): { multaGenerada?: boolean; montoMulta?: number | null } {
    const hasM = multaGeneradaInput !== undefined;
    const hasMonto = montoMultaInput !== undefined;

    if (!hasM && !hasMonto) {
      return { multaGenerada: undefined, montoMulta: undefined };
    }

    const multaGenerada = hasM ? multaGeneradaInput : current?.multaGenerada;
    const montoMulta = hasMonto
      ? montoMultaInput ?? null
      : current?.montoMulta === undefined
        ? undefined
        : current.montoMulta === null
          ? null
          : Number(current.montoMulta);

    if (multaGenerada === undefined) {
      throw new BadRequestException('multaGenerada es obligatoria cuando se envía montoMulta.');
    }

    if (!multaGenerada) {
      if (hasMonto && montoMulta !== null) {
        throw new BadRequestException(
          'montoMulta debe ser null cuando multaGenerada es false.',
        );
      }
      return { multaGenerada: false, montoMulta: null };
    }

    if (montoMulta === undefined || montoMulta === null) {
      throw new BadRequestException(
        'montoMulta es obligatorio cuando multaGenerada es true.',
      );
    }
    if (montoMulta < 0) {
      throw new BadRequestException('montoMulta no puede ser menor que 0.');
    }

    return { multaGenerada: true, montoMulta };
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_faena_participacion: bigint;
    id_faena: bigint;
    id_persona: bigint;
    estado: string;
    hora_llegada: Date | null;
    cant_personas_extra: number;
    multa_generada: boolean;
    monto_multa: Prisma.Decimal | null;
    observaciones: string | null;
    created_at: Date;
    created_by_user: bigint;
    updated_at: Date | null;
    updated_by_user: bigint | null;
    anulado: boolean;
    anulado_at: Date | null;
    anulado_by_user: bigint | null;
    motivo_anulacion: string | null;
  }): FaenaParticipacionResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idFaenaParticipacion: Number(item.id_faena_participacion),
      idFaena: Number(item.id_faena),
      idPersona: Number(item.id_persona),
      estado: item.estado,
      horaLlegada: item.hora_llegada,
      cantPersonasExtra: item.cant_personas_extra,
      multaGenerada: item.multa_generada,
      montoMulta: item.monto_multa === null ? null : Number(item.monto_multa),
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
