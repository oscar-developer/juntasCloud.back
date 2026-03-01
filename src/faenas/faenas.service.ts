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
      fecha: this.date(dto.fecha, 'fecha'),
      descripcion: this.req(dto.descripcion, 'descripcion'),
      lugar: this.n(dto.lugar),
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
        fecha: from || to ? { gte: from, lte: to } : undefined,
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
            fecha: dto.fecha !== undefined ? this.date(dto.fecha, 'fecha') : undefined,
            descripcion: dto.descripcion !== undefined ? this.req(dto.descripcion, 'descripcion') : undefined,
            lugar: this.on(dto.lugar),
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
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`);
      await tx.$executeRaw(Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`);
      const m = await tx.tenant_users.findFirst({ where: { id_tenant: tenantId, id_user: userId, estado: 'ACTIVO' }, select: { id_user: true } });
      if (!m) throw new ForbiddenException('El usuario no pertenece al tenant activo.');
      return fn(tx);
    });
  }
  private req(v: string, f: string) { const n = v?.trim(); if (!n) throw new BadRequestException(`${f} es obligatorio.`); return n; }
  private n(v?: string | null) { if (v === undefined || v === null) return null; const n = v.trim(); return n || null; }
  private on(v?: string | null) { if (v === undefined) return undefined; return this.n(v); }
  private date(v: string, f: string) { const d = new Date(v); if (Number.isNaN(d.getTime())) throw new BadRequestException(`${f} no tiene formato valido.`); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  private known(e: unknown, msg: string) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw new NotFoundException(msg); }
  private toRes(i: { id_tenant: bigint; id_faena: bigint; fecha: Date; descripcion: string; lugar: string | null; observaciones: string | null; }): FaenaResponseDto {
    return { idTenant: Number(i.id_tenant), idFaena: Number(i.id_faena), fecha: i.fecha, descripcion: i.descripcion, lugar: i.lugar, observaciones: i.observaciones };
  }
}
