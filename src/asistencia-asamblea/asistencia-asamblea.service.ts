import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnularAsistenciaAsambleaDto } from './dto/anular-asistencia-asamblea.dto';
import { AsistenciaAsambleaResponseDto } from './dto/asistencia-asamblea-response.dto';
import { CreateAsistenciaAsambleaDto } from './dto/create-asistencia-asamblea.dto';
import { QueryAsistenciaAsambleaDto } from './dto/query-asistencia-asamblea.dto';
import { UpdateAsistenciaAsambleaDto } from './dto/update-asistencia-asamblea.dto';

@Injectable()
export class AsistenciaAsambleaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    idAsamblea: bigint,
    dto: CreateAsistenciaAsambleaDto,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureAsambleaExists(tx, tenantId, idAsamblea);
      await this.ensurePersonaExists(tx, tenantId, BigInt(dto.idPersona));

      try {
        const item = await tx.asistencia_asamblea.create({
          data: {
            id_tenant: tenantId,
            id_asamblea: idAsamblea,
            id_persona: BigInt(dto.idPersona),
            estado: dto.estado ?? 'PENDIENTE',
            hora_llegada: this.optionalTime(dto.horaLlegada, 'horaLlegada'),
            es_padronado_en_momento: dto.esPadronadoEnMomento,
            observaciones: this.nullable(dto.observaciones),
            created_by_user: userId,
          },
        });

        return this.toResponse(item);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('La asistencia de la persona en la asamblea ya existe.');
        }
        throw error;
      }
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    idAsamblea: bigint,
    query: QueryAsistenciaAsambleaDto,
  ): Promise<AsistenciaAsambleaResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureAsambleaExists(tx, tenantId, idAsamblea);

      const items = await tx.asistencia_asamblea.findMany({
        where: {
          id_tenant: tenantId,
          id_asamblea: idAsamblea,
          estado: query.estado,
          anulado: query.anulado,
          id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
        },
        orderBy: { id_asistencia: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idAsistencia: bigint,
  ): Promise<AsistenciaAsambleaResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.asistencia_asamblea.findUnique({
        where: {
          id_tenant_id_asistencia: {
            id_tenant: tenantId,
            id_asistencia: idAsistencia,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro la asistencia de asamblea solicitada.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idAsistencia: bigint,
    dto: UpdateAsistenciaAsambleaDto,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.asistencia_asamblea.findUnique({
        where: {
          id_tenant_id_asistencia: {
            id_tenant: tenantId,
            id_asistencia: idAsistencia,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la asistencia de asamblea solicitada.');
      }
      if (current.anulado) {
        throw new ConflictException('No se puede editar una asistencia anulada.');
      }
      if (dto.idPersona !== undefined) {
        throw new BadRequestException('idPersona no se puede editar en este endpoint.');
      }

      const item = await tx.asistencia_asamblea.update({
        where: {
          id_tenant_id_asistencia: {
            id_tenant: tenantId,
            id_asistencia: idAsistencia,
          },
        },
        data: {
          estado: dto.estado,
          hora_llegada:
            dto.horaLlegada !== undefined
              ? this.optionalTime(dto.horaLlegada, 'horaLlegada')
              : undefined,
          es_padronado_en_momento: dto.esPadronadoEnMomento,
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
    idAsistencia: bigint,
    dto: AnularAsistenciaAsambleaDto,
  ): Promise<AsistenciaAsambleaResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.asistencia_asamblea.findUnique({
        where: {
          id_tenant_id_asistencia: {
            id_tenant: tenantId,
            id_asistencia: idAsistencia,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro la asistencia de asamblea solicitada.');
      }
      if (current.anulado) {
        throw new ConflictException('La asistencia de asamblea ya se encuentra anulada.');
      }

      const item = await tx.asistencia_asamblea.update({
        where: {
          id_tenant_id_asistencia: {
            id_tenant: tenantId,
            id_asistencia: idAsistencia,
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

  parseId(value: string, field = 'idAsistencia'): bigint {
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

  private async ensureAsambleaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idAsamblea: bigint,
  ): Promise<void> {
    const exists = await tx.asambleas.findUnique({
      where: { id_tenant_id_asamblea: { id_tenant: tenantId, id_asamblea: idAsamblea } },
      select: { id_asamblea: true },
    });
    if (!exists) {
      throw new NotFoundException('La asamblea indicada no existe en el tenant activo.');
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

  private toResponse(item: {
    id_tenant: bigint;
    id_asistencia: bigint;
    id_asamblea: bigint;
    id_persona: bigint;
    estado: string;
    hora_llegada: Date | null;
    es_padronado_en_momento: boolean;
    observaciones: string | null;
    created_at: Date;
    created_by_user: bigint;
    updated_at: Date | null;
    updated_by_user: bigint | null;
    anulado: boolean;
    anulado_at: Date | null;
    anulado_by_user: bigint | null;
    motivo_anulacion: string | null;
  }): AsistenciaAsambleaResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idAsistencia: Number(item.id_asistencia),
      idAsamblea: Number(item.id_asamblea),
      idPersona: Number(item.id_persona),
      estado: item.estado,
      horaLlegada: item.hora_llegada,
      esPadronadoEnMomento: item.es_padronado_en_momento,
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
