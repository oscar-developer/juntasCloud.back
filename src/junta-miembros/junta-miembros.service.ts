import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJuntaMiembroDto } from './dto/create-junta-miembro.dto';
import { JuntaMiembroResponseDto } from './dto/junta-miembro-response.dto';
import { QueryJuntaMiembrosDto } from './dto/query-junta-miembros.dto';
import { UpdateJuntaMiembroDto } from './dto/update-junta-miembro.dto';

@Injectable()
export class JuntaMiembrosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateJuntaMiembroDto,
  ): Promise<JuntaMiembroResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const idJunta = BigInt(dto.idJunta);
      const idPersona = BigInt(dto.idPersona);
      const fechaInicio = this.toDate(dto.fechaInicio, 'fechaInicio');
      const fechaFin = dto.fechaFin ? this.toDate(dto.fechaFin, 'fechaFin') : null;

      this.assertDateOrder(fechaInicio, fechaFin);
      await this.ensureJuntaExists(tx, tenantId, idJunta);
      await this.ensurePersonaExists(tx, tenantId, idPersona);

      const item = await tx.junta_miembros.create({
        data: {
          id_tenant: tenantId,
          id_junta: idJunta,
          id_persona: idPersona,
          cargo: dto.cargo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      });

      return this.toResponse(item);
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryJuntaMiembrosDto,
  ): Promise<JuntaMiembroResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const today = query.vigentes ? this.todayUtcDate() : undefined;
      const items = await tx.junta_miembros.findMany({
        where: {
          id_tenant: tenantId,
          id_junta: query.idJunta ? BigInt(query.idJunta) : undefined,
          id_persona: query.idPersona ? BigInt(query.idPersona) : undefined,
          cargo: query.cargo,
          AND: query.vigentes
            ? [
                {
                  OR: [{ fecha_fin: null }, { fecha_fin: { gte: today } }],
                },
              ]
            : undefined,
        },
        orderBy: { id_junta_miembro: 'desc' },
      });

      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    idJuntaMiembro: bigint,
  ): Promise<JuntaMiembroResponseDto> {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.junta_miembros.findUnique({
        where: {
          id_tenant_id_junta_miembro: {
            id_tenant: tenantId,
            id_junta_miembro: idJuntaMiembro,
          },
        },
      }),
    );

    if (!item) {
      throw new NotFoundException('No se encontro el miembro de junta solicitado.');
    }

    return this.toResponse(item);
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    idJuntaMiembro: bigint,
    dto: UpdateJuntaMiembroDto,
  ): Promise<JuntaMiembroResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const current = await tx.junta_miembros.findUnique({
        where: {
          id_tenant_id_junta_miembro: {
            id_tenant: tenantId,
            id_junta_miembro: idJuntaMiembro,
          },
        },
      });

      if (!current) {
        throw new NotFoundException('No se encontro el miembro de junta solicitado.');
      }

      const idJunta = dto.idJunta ? BigInt(dto.idJunta) : current.id_junta;
      const idPersona = dto.idPersona ? BigInt(dto.idPersona) : current.id_persona;
      const fechaInicio = dto.fechaInicio
        ? this.toDate(dto.fechaInicio, 'fechaInicio')
        : current.fecha_inicio;
      const fechaFin =
        dto.fechaFin !== undefined
          ? dto.fechaFin
            ? this.toDate(dto.fechaFin, 'fechaFin')
            : null
          : current.fecha_fin;

      this.assertDateOrder(fechaInicio, fechaFin);

      if (dto.idJunta !== undefined) {
        await this.ensureJuntaExists(tx, tenantId, idJunta);
      }
      if (dto.idPersona !== undefined) {
        await this.ensurePersonaExists(tx, tenantId, idPersona);
      }

      const item = await tx.junta_miembros.update({
        where: {
          id_tenant_id_junta_miembro: {
            id_tenant: tenantId,
            id_junta_miembro: idJuntaMiembro,
          },
        },
        data: {
          id_junta: dto.idJunta !== undefined ? idJunta : undefined,
          id_persona: dto.idPersona !== undefined ? idPersona : undefined,
          cargo: dto.cargo,
          fecha_inicio: dto.fechaInicio !== undefined ? fechaInicio : undefined,
          fecha_fin: dto.fechaFin !== undefined ? fechaFin : undefined,
        },
      });

      return this.toResponse(item);
    });
  }

  async remove(tenantId: bigint, userId: bigint, idJuntaMiembro: bigint): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        await tx.junta_miembros.delete({
          where: {
            id_tenant_id_junta_miembro: {
              id_tenant: tenantId,
              id_junta_miembro: idJuntaMiembro,
            },
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          throw new ConflictException(
            'No se puede eliminar el miembro de junta porque tiene relaciones asociadas.',
          );
        }
        this.handleKnown(error, 'No se encontro el miembro de junta solicitado.');
        throw error;
      }
    });
  }

  parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('idJuntaMiembro debe ser un entero positivo.');
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

  private async ensureJuntaExists(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    idJunta: bigint,
  ): Promise<void> {
    const exists = await tx.juntas_directivas.findUnique({
      where: { id_tenant_id_junta: { id_tenant: tenantId, id_junta: idJunta } },
      select: { id_junta: true },
    });
    if (!exists) {
      throw new NotFoundException('La junta directiva indicada no existe en el tenant activo.');
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

  private toDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} no tiene formato valido.`);
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private todayUtcDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private assertDateOrder(fechaInicio: Date, fechaFin: Date | null): void {
    if (fechaFin && fechaFin.getTime() < fechaInicio.getTime()) {
      throw new BadRequestException('fechaFin no puede ser menor que fechaInicio.');
    }
  }

  private handleKnown(error: unknown, message: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(message);
    }
  }

  private toResponse(item: {
    id_tenant: bigint;
    id_junta_miembro: bigint;
    id_junta: bigint;
    id_persona: bigint;
    cargo: string;
    fecha_inicio: Date;
    fecha_fin: Date | null;
  }): JuntaMiembroResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idJuntaMiembro: Number(item.id_junta_miembro),
      idJunta: Number(item.id_junta),
      idPersona: Number(item.id_persona),
      cargo: item.cargo,
      fechaInicio: item.fecha_inicio,
      fechaFin: item.fecha_fin,
    };
  }
}
