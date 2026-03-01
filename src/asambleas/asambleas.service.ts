import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AsambleaResponseDto } from './dto/asamblea-response.dto';
import { CreateAsambleaDto } from './dto/create-asamblea.dto';
import { QueryAsambleasDto } from './dto/query-asambleas.dto';
import { UpdateAsambleaDto } from './dto/update-asamblea.dto';

@Injectable()
export class AsambleasService {
  constructor(private readonly prisma: PrismaService) {}
  async create(t: bigint, u: bigint, d: CreateAsambleaDto) { return this.ctx(u, t, async (tx) => this.toRes(await tx.asambleas.create({ data: { id_tenant: t, fecha: this.dt(d.fecha,'fecha'), tipo: d.tipo, tema_principal: this.req(d.temaPrincipal,'temaPrincipal'), lugar: this.n(d.lugar), quorum_requerido: d.quorumRequerido ?? null, observaciones: this.n(d.observaciones) } }))); }
  async findAll(t: bigint, u: bigint, q: QueryAsambleasDto) { const from = q.from ? new Date(q.from) : undefined; const to = q.to ? new Date(q.to) : undefined; return this.ctx(u, t, async (tx) => (await tx.asambleas.findMany({ where: { id_tenant: t, tipo: q.tipo, fecha: from || to ? { gte: from, lte: to } : undefined }, orderBy: { id_asamblea: 'desc' } })).map((i) => this.toRes(i))); }
  async findOne(t: bigint, u: bigint, id: bigint) { const i = await this.ctx(u, t, (tx) => tx.asambleas.findUnique({ where: { id_tenant_id_asamblea: { id_tenant: t, id_asamblea: id } } })); if (!i) throw new NotFoundException('No se encontro la asamblea solicitada.'); return this.toRes(i); }
  async update(t: bigint, u: bigint, id: bigint, d: UpdateAsambleaDto) { return this.ctx(u, t, async (tx) => { try { return this.toRes(await tx.asambleas.update({ where: { id_tenant_id_asamblea: { id_tenant: t, id_asamblea: id } }, data: { fecha: d.fecha !== undefined ? this.dt(d.fecha,'fecha') : undefined, tipo: d.tipo, tema_principal: d.temaPrincipal !== undefined ? this.req(d.temaPrincipal,'temaPrincipal') : undefined, lugar: this.on(d.lugar), quorum_requerido: d.quorumRequerido ?? undefined, observaciones: this.on(d.observaciones) } })); } catch (e) { this.known(e,'No se encontro la asamblea solicitada.'); throw e; } }); }
  async remove(t: bigint, u: bigint, id: bigint) { await this.ctx(u, t, async (tx) => { try { await tx.asambleas.delete({ where: { id_tenant_id_asamblea: { id_tenant: t, id_asamblea: id } } }); } catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw new ConflictException('No se puede eliminar la asamblea porque tiene relaciones asociadas.'); this.known(e,'No se encontro la asamblea solicitada.'); throw e; } }); }
  parseId(id: string) { if (!/^\d+$/.test(id)) throw new BadRequestException('idAsamblea debe ser un entero positivo.'); return BigInt(id); }
  private async ctx<T>(u: bigint, t: bigint, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> { return this.prisma.$transaction(async (tx) => { await tx.$executeRaw(Prisma.sql`SELECT set_config('app.user_id', ${u.toString()}, true)`); await tx.$executeRaw(Prisma.sql`SELECT set_config('app.tenant_id', ${t.toString()}, true)`); const m = await tx.tenant_users.findFirst({ where: { id_tenant: t, id_user: u, estado: 'ACTIVO' }, select: { id_user: true } }); if (!m) throw new ForbiddenException('El usuario no pertenece al tenant activo.'); return fn(tx); }); }
  private req(v: string, f: string) { const n = v?.trim(); if (!n) throw new BadRequestException(`${f} es obligatorio.`); return n; }
  private n(v?: string | null) { if (v === undefined || v === null) return null; const n = v.trim(); return n || null; }
  private on(v?: string | null) { if (v === undefined) return undefined; return this.n(v); }
  private dt(v: string, f: string) { const d = new Date(v); if (Number.isNaN(d.getTime())) throw new BadRequestException(`${f} no tiene formato valido.`); return d; }
  private known(e: unknown, m: string) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw new NotFoundException(m); }
  private toRes(i: { id_tenant: bigint; id_asamblea: bigint; fecha: Date; tipo: string; tema_principal: string; lugar: string | null; quorum_requerido: number | null; observaciones: string | null; }): AsambleaResponseDto {
    return { idTenant: Number(i.id_tenant), idAsamblea: Number(i.id_asamblea), fecha: i.fecha, tipo: i.tipo, temaPrincipal: i.tema_principal, lugar: i.lugar, quorumRequerido: i.quorum_requerido, observaciones: i.observaciones };
  }
}
