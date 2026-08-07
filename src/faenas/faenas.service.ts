import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaenaDto } from './dto/create-faena.dto';
import { FaenaResponseDto } from './dto/faena-response.dto';
import { QueryFaenasDto } from './dto/query-faenas.dto';
import { UpdateFaenaDto } from './dto/update-faena.dto';

@Injectable()
export class FaenasService {
  constructor(private readonly prisma: PrismaService) {}
  async create(tenantId: bigint, userId: bigint, dto: CreateFaenaDto) {
    return this.ctx(userId, tenantId, async (tx) => this.toRes(await tx.faenas.create({ data: {
      id_tenant: tenantId,
      fecha_programada: this.date(dto.fechaProgramada, 'fechaProgramada'),
      hora_inicio: this.optionalTime(dto.horaInicio, 'horaInicio'),
      hora_fin: this.optionalTime(dto.horaFin, 'horaFin'),
      descripcion: this.req(dto.descripcion, 'descripcion'),
      lugar: this.n(dto.lugar),
      tipo_faena: dto.tipoFaena ?? 'ORDINARIA',
      es_obligatoria: dto.esObligatoria ?? true,
      estado: dto.estado ?? 'PROGRAMADA',
      monto_multa_base: dto.montoMultaBase ?? null,
      observaciones: this.n(dto.observaciones),
    } })));
  }
  async findAll(tenantId: bigint, userId: bigint, query: QueryFaenasDto) {
    const from = query.from ? this.date(query.from, 'from') : undefined;
    const to = query.to ? this.date(query.to, 'to') : undefined;
    const s = query.search?.trim();
    return this.ctx(userId, tenantId, async (tx) => (await tx.faenas.findMany({
      where: {
        id_tenant: tenantId,
        fecha_programada: from || to ? { gte: from, lte: to } : undefined,
        tipo_faena: query.tipoFaena,
        estado: query.estado,
        OR: s ? [{ descripcion: { contains: s, mode: 'insensitive' } }, { lugar: { contains: s, mode: 'insensitive' } }] : undefined,
      },
      orderBy: { id_faena: 'desc' },
    })).map((i) => this.toRes(i)));
  }
  async findOne(tenantId: bigint, userId: bigint, id: bigint) {
    const item = await this.ctx(userId, tenantId, (tx) => tx.faenas.findUnique({ where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: id } } }));
    if (!item) throw new NotFoundException('No se encontro la faena solicitada.');
    return this.toRes(item);
  }
  async update(tenantId: bigint, userId: bigint, id: bigint, dto: UpdateFaenaDto) {
    return this.ctx(userId, tenantId, async (tx) => {
      try {
        return this.toRes(await tx.faenas.update({
          where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: id } },
          data: {
            fecha_programada: dto.fechaProgramada !== undefined ? this.date(dto.fechaProgramada, 'fechaProgramada') : undefined,
            hora_inicio: dto.horaInicio !== undefined ? this.optionalTime(dto.horaInicio, 'horaInicio') : undefined,
            hora_fin: dto.horaFin !== undefined ? this.optionalTime(dto.horaFin, 'horaFin') : undefined,
            descripcion: dto.descripcion !== undefined ? this.req(dto.descripcion, 'descripcion') : undefined,
            lugar: this.on(dto.lugar),
            tipo_faena: dto.tipoFaena,
            es_obligatoria: dto.esObligatoria,
            estado: dto.estado,
            monto_multa_base: dto.montoMultaBase !== undefined ? dto.montoMultaBase : undefined,
            observaciones: this.on(dto.observaciones),
          },
        }));
      } catch (e) { this.known(e, 'No se encontro la faena solicitada.'); throw e; }
    });
  }
  async remove(tenantId: bigint, userId: bigint, id: bigint) {
    await this.ctx(userId, tenantId, async (tx) => {
      try {
        await tx.faenas.delete({ where: { id_tenant_id_faena: { id_tenant: tenantId, id_faena: id } } });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw new ConflictException('No se puede eliminar la faena porque tiene relaciones asociadas.');
        this.known(e, 'No se encontro la faena solicitada.'); throw e;
      }
    });
  }
  parseId(id: string) { if (!/^\d+$/.test(id)) throw new BadRequestException('idFaena debe ser un entero positivo.'); return BigInt(id); }
  private async ctx<T>(userId: bigint, tenantId: bigint, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.withTenantContext(userId, tenantId, async (tx) => {
      const m = await tx.tenant_users.findFirst({ where: { id_tenant: tenantId, id_user: userId, estado: 'ACTIVO' }, select: { id_user: true } });
      if (!m) throw new ForbiddenException('El usuario no pertenece al tenant activo.');
      return fn(tx);
    });
  }
  private req(v: string, f: string) { const n = v?.trim(); if (!n) throw new BadRequestException(`${f} es obligatorio.`); return n; }
  private n(v?: string | null) { if (v === undefined || v === null) return null; const n = v.trim(); return n || null; }
  private on(v?: string | null) { if (v === undefined) return undefined; return this.n(v); }
  private date(v: string, f: string) { const d = new Date(v); if (Number.isNaN(d.getTime())) throw new BadRequestException(`${f} no tiene formato valido.`); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  private optionalTime(v: string | null | undefined, f: string) { if (v === undefined || v === null) return null; return this.time(v, f); }
  private time(v: string, f: string) {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
    if (!match) throw new BadRequestException(`${f} debe tener formato HH:mm o HH:mm:ss.`);
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] ?? '0');
    if (hours > 23 || minutes > 59 || seconds > 59) {
      throw new BadRequestException(`${f} no tiene una hora valida.`);
    }
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
  }
  private known(e: unknown, msg: string) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw new NotFoundException(msg); }
  private toRes(i: {
    id_tenant: bigint;
    id_faena: bigint;
    fecha_programada: Date;
    hora_inicio: Date | null;
    hora_fin: Date | null;
    descripcion: string;
    lugar: string | null;
    tipo_faena: string;
    es_obligatoria: boolean;
    estado: string;
    monto_multa_base: Prisma.Decimal | null;
    observaciones: string | null;
  }): FaenaResponseDto {
    return {
      idTenant: Number(i.id_tenant),
      idFaena: Number(i.id_faena),
      fechaProgramada: i.fecha_programada,
      horaInicio: i.hora_inicio,
      horaFin: i.hora_fin,
      descripcion: i.descripcion,
      lugar: i.lugar,
      tipoFaena: i.tipo_faena,
      esObligatoria: i.es_obligatoria,
      estado: i.estado,
      montoMultaBase: i.monto_multa_base === null ? null : Number(i.monto_multa_base),
      observaciones: i.observaciones,
    };
  }
}
