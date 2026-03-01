import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BienResponseDto } from './dto/bien-response.dto';
import { CreateBienDto } from './dto/create-bien.dto';
import { QueryBienesDto } from './dto/query-bienes.dto';
import { UpdateBienDto } from './dto/update-bien.dto';

@Injectable()
export class BienesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(t: bigint, u: bigint, d: CreateBienDto) {
    const fechaAlta = this.d(d.fechaAlta, 'fechaAlta');
    const fechaBaja = d.fechaBaja ? this.d(d.fechaBaja, 'fechaBaja') : null;
    this.assertDateOrder(fechaAlta, fechaBaja);
    return this.ctx(u, t, async (tx) => this.res(await tx.bienes.create({ data: {
      id_tenant: t, descripcion: this.req(d.descripcion, 'descripcion'), tipo: this.n(d.tipo), cantidad: d.cantidad,
      valor_estimado: d.valorEstimado ?? null, ubicacion: this.n(d.ubicacion), fecha_alta: fechaAlta, fecha_baja: fechaBaja,
      estado: d.estado ?? 'BUENO', observaciones: this.n(d.observaciones),
    } })));
  }
  async findAll(t: bigint, u: bigint, q: QueryBienesDto) {
    const page = q.page ?? 1; const pageSize = q.pageSize ?? 20; const s = q.search?.trim();
    return this.ctx(u, t, async (tx) => (await tx.bienes.findMany({
      where: { id_tenant: t, estado: q.estado, tipo: q.tipo?.trim() || undefined, OR: s ? [{ descripcion: { contains: s, mode: 'insensitive' } }, { tipo: { contains: s, mode: 'insensitive' } }, { ubicacion: { contains: s, mode: 'insensitive' } }] : undefined },
      orderBy: { id_bien: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
    })).map((i) => this.res(i)));
  }
  async findOne(t: bigint, u: bigint, id: bigint) {
    const i = await this.ctx(u, t, (tx) => tx.bienes.findUnique({ where: { id_tenant_id_bien: { id_tenant: t, id_bien: id } } }));
    if (!i) throw new NotFoundException('No se encontro el bien solicitado.');
    return this.res(i);
  }
  async update(t: bigint, u: bigint, id: bigint, d: UpdateBienDto) {
    return this.ctx(u, t, async (tx) => {
      const current = await tx.bienes.findUnique({ where: { id_tenant_id_bien: { id_tenant: t, id_bien: id } } });
      if (!current) throw new NotFoundException('No se encontro el bien solicitado.');
      const fechaAlta = d.fechaAlta !== undefined ? this.d(d.fechaAlta, 'fechaAlta') : current.fecha_alta;
      const fechaBaja = d.fechaBaja !== undefined ? (d.fechaBaja ? this.d(d.fechaBaja, 'fechaBaja') : null) : current.fecha_baja;
      this.assertDateOrder(fechaAlta, fechaBaja);
      const i = await tx.bienes.update({
        where: { id_tenant_id_bien: { id_tenant: t, id_bien: id } },
        data: {
          descripcion: d.descripcion !== undefined ? this.req(d.descripcion, 'descripcion') : undefined,
          tipo: this.on(d.tipo), cantidad: d.cantidad, valor_estimado: d.valorEstimado ?? undefined, ubicacion: this.on(d.ubicacion),
          fecha_alta: d.fechaAlta !== undefined ? fechaAlta : undefined, fecha_baja: d.fechaBaja !== undefined ? fechaBaja : undefined,
          estado: d.estado, observaciones: this.on(d.observaciones),
        },
      });
      return this.res(i);
    });
  }
  async remove(t: bigint, u: bigint, id: bigint) {
    return this.ctx(u, t, async (tx) => {
      const current = await tx.bienes.findUnique({ where: { id_tenant_id_bien: { id_tenant: t, id_bien: id } } });
      if (!current) throw new NotFoundException('No se encontro el bien solicitado.');
      const i = await tx.bienes.update({
        where: { id_tenant_id_bien: { id_tenant: t, id_bien: id } },
        data: { estado: 'DADO_DE_BAJA', fecha_baja: current.fecha_baja ?? this.today() },
      });
      return this.res(i);
    });
  }
  parseId(id: string) { if (!/^\d+$/.test(id)) throw new BadRequestException('idBien debe ser un entero positivo.'); return BigInt(id); }
  private async ctx<T>(u: bigint, t: bigint, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> { return this.prisma.$transaction(async (tx) => { await tx.$executeRaw(Prisma.sql`SELECT set_config('app.user_id', ${u.toString()}, true)`); await tx.$executeRaw(Prisma.sql`SELECT set_config('app.tenant_id', ${t.toString()}, true)`); const m = await tx.tenant_users.findFirst({ where: { id_tenant: t, id_user: u, estado: 'ACTIVO' }, select: { id_user: true } }); if (!m) throw new ForbiddenException('El usuario no pertenece al tenant activo.'); return fn(tx); }); }
  private req(v: string, f: string) { const n = v?.trim(); if (!n) throw new BadRequestException(`${f} es obligatorio.`); return n; }
  private n(v?: string | null) { if (v === undefined || v === null) return null; const n = v.trim(); return n || null; }
  private on(v?: string | null) { if (v === undefined) return undefined; return this.n(v); }
  private d(v: string, f: string) { const d = new Date(v); if (Number.isNaN(d.getTime())) throw new BadRequestException(`${f} no tiene formato valido.`); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  private today() { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())); }
  private assertDateOrder(a: Date, b: Date | null) { if (b && b.getTime() < a.getTime()) throw new BadRequestException('fechaBaja no puede ser menor que fechaAlta.'); }
  private res(i: { id_tenant: bigint; id_bien: bigint; descripcion: string; tipo: string | null; cantidad: number; valor_estimado: Prisma.Decimal | null; ubicacion: string | null; fecha_alta: Date; fecha_baja: Date | null; estado: string; observaciones: string | null; }): BienResponseDto {
    return { idTenant: Number(i.id_tenant), idBien: Number(i.id_bien), descripcion: i.descripcion, tipo: i.tipo, cantidad: i.cantidad, valorEstimado: i.valor_estimado === null ? null : Number(i.valor_estimado), ubicacion: i.ubicacion, fechaAlta: i.fecha_alta, fechaBaja: i.fecha_baja, estado: i.estado, observaciones: i.observaciones };
  }
}
