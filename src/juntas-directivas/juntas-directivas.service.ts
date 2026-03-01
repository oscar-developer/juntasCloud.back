import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJuntaDirectivaDto } from './dto/create-junta-directiva.dto';
import { JuntaDirectivaResponseDto } from './dto/junta-directiva-response.dto';
import { QueryJuntasDirectivasDto } from './dto/query-juntas-directivas.dto';
import { UpdateJuntaDirectivaDto } from './dto/update-junta-directiva.dto';

@Injectable()
export class JuntasDirectivasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: bigint, userId: bigint, dto: CreateJuntaDirectivaDto) {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      await this.assertSingleVigente(tx, tenantId, dto.estado ?? 'VIGENTE');
      const fechaInicio = this.toDate(dto.fechaInicio, 'fechaInicio');
      const fechaFin = dto.fechaFin ? this.toDate(dto.fechaFin, 'fechaFin') : null;
      this.assertDateOrder(fechaInicio, fechaFin);
      const junta = await tx.juntas_directivas.create({
        data: {
          id_tenant: tenantId,
          nombre: this.required(dto.nombre, 'nombre'),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: dto.estado ?? 'VIGENTE',
          observaciones: this.nullable(dto.observaciones),
        },
      });
      return this.toResponse(junta);
    });
  }

  async findAll(tenantId: bigint, userId: bigint, query: QueryJuntasDirectivasDto) {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const from = query.from ? this.toDate(query.from, 'from') : undefined;
      const to = query.to ? this.toDate(query.to, 'to') : undefined;
      const items = await tx.juntas_directivas.findMany({
        where: {
          id_tenant: tenantId,
          estado: query.estado,
          fecha_inicio: from || to ? { gte: from, lte: to } : undefined,
        },
        orderBy: { id_junta: 'desc' },
      });
      return items.map((item) => this.toResponse(item));
    });
  }

  async findOne(tenantId: bigint, userId: bigint, idJunta: bigint) {
    const item = await this.withTenantContext(userId, tenantId, (tx) =>
      tx.juntas_directivas.findUnique({
        where: { id_tenant_id_junta: { id_tenant: tenantId, id_junta: idJunta } },
      }),
    );
    if (!item) throw new NotFoundException('No se encontro la junta directiva solicitada.');
    return this.toResponse(item);
  }

  async update(tenantId: bigint, userId: bigint, idJunta: bigint, dto: UpdateJuntaDirectivaDto) {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const fechaInicio = dto.fechaInicio ? this.toDate(dto.fechaInicio, 'fechaInicio') : undefined;
      const fechaFin = dto.fechaFin !== undefined ? (dto.fechaFin ? this.toDate(dto.fechaFin, 'fechaFin') : null) : undefined;
      if (fechaInicio || fechaFin !== undefined) {
        const current = await tx.juntas_directivas.findUnique({
          where: { id_tenant_id_junta: { id_tenant: tenantId, id_junta: idJunta } },
        });
        if (!current) throw new NotFoundException('No se encontro la junta directiva solicitada.');
        this.assertDateOrder(fechaInicio ?? current.fecha_inicio, fechaFin === undefined ? current.fecha_fin : fechaFin);
      }
      if (dto.estado === 'VIGENTE') {
        await this.assertSingleVigente(tx, tenantId, dto.estado, idJunta);
      }
      try {
        const item = await tx.juntas_directivas.update({
          where: { id_tenant_id_junta: { id_tenant: tenantId, id_junta: idJunta } },
          data: {
            nombre: dto.nombre !== undefined ? this.required(dto.nombre, 'nombre') : undefined,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: dto.estado,
            observaciones: this.optionalNullable(dto.observaciones),
          },
        });
        return this.toResponse(item);
      } catch (error) {
        this.handleKnown(error, 'No se encontro la junta directiva solicitada.');
        throw error;
      }
    });
  }

  async remove(tenantId: bigint, userId: bigint, idJunta: bigint): Promise<void> {
    await this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        await tx.juntas_directivas.delete({
          where: { id_tenant_id_junta: { id_tenant: tenantId, id_junta: idJunta } },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          throw new ConflictException(
            'No se puede eliminar la junta directiva porque tiene relaciones asociadas.',
          );
        }
        this.handleKnown(error, 'No se encontro la junta directiva solicitada.');
        throw error;
      }
    });
  }

  parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) throw new BadRequestException('idJunta debe ser un entero positivo.');
    return BigInt(id);
  }

  private async withTenantContext<T>(userId: bigint, tenantId: bigint, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`);
      await tx.$executeRaw(Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`);
      const m = await tx.tenant_users.findFirst({ where: { id_tenant: tenantId, id_user: userId, estado: 'ACTIVO' }, select: { id_user: true } });
      if (!m) throw new ForbiddenException('El usuario no pertenece al tenant activo.');
      return fn(tx);
    });
  }

  private async assertSingleVigente(tx: Prisma.TransactionClient, tenantId: bigint, estado: string, excludeId?: bigint) {
    if (estado !== 'VIGENTE') return;
    const existing = await tx.juntas_directivas.findFirst({
      where: {
        id_tenant: tenantId,
        estado: 'VIGENTE',
        id_junta: excludeId ? { not: excludeId } : undefined,
      },
      select: { id_junta: true },
    });
    if (existing) {
      throw new ConflictException('Ya existe una junta directiva vigente en este tenant.');
    }
  }

  private required(value: string, field: string): string {
    const n = value?.trim();
    if (!n) throw new BadRequestException(`${field} es obligatorio.`);
    return n;
  }
  private nullable(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const n = value.trim();
    return n || null;
  }
  private optionalNullable(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    return this.nullable(value);
  }
  private toDate(value: string, field: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`${field} no tiene formato valido.`);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  private assertDateOrder(inicio: Date, fin: Date | null | undefined) {
    if (fin && fin.getTime() < inicio.getTime()) {
      throw new BadRequestException('fechaFin no puede ser menor que fechaInicio.');
    }
  }
  private handleKnown(error: unknown, message: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(message);
    }
  }
  private toResponse(item: {
    id_tenant: bigint; id_junta: bigint; nombre: string; fecha_inicio: Date; fecha_fin: Date | null; estado: string; observaciones: string | null;
  }): JuntaDirectivaResponseDto {
    return {
      idTenant: Number(item.id_tenant),
      idJunta: Number(item.id_junta),
      nombre: item.nombre,
      fechaInicio: item.fecha_inicio,
      fechaFin: item.fecha_fin,
      estado: item.estado,
      observaciones: item.observaciones,
    };
  }
}
