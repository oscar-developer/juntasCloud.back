import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryRendicionCuentasDto } from './dto/query-rendicion-cuentas.dto';
import {
  RendicionCuentasCategoriaDto,
  RendicionCuentasDetalleMovimientoDto,
  RendicionCuentasResponseDto,
} from './dto/rendicion-cuentas-response.dto';

type ReporteRow = {
  reporte: ReporteRendicionCuentasDb | null;
};

type ReporteRendicionCuentasDb = {
  periodo?: {
    fechaInicio?: string | Date | null;
    fechaFin?: string | Date | null;
  } | null;
  resumen?: {
    saldoInicial?: number | string | null;
    totalIngresos?: number | string | null;
    totalGastos?: number | string | null;
    saldoFinal?: number | string | null;
  } | null;
  porCategoria?: Array<{
    tipo?: string | null;
    categoria?: string | null;
    total?: number | string | null;
  }> | null;
  detalleMovimientos?: Array<{
    fecha?: string | Date | null;
    tipo?: string | null;
    categoria?: string | null;
    descripcion?: string | null;
    monto?: number | string | null;
    medio_pago?: string | null;
    doc_referencia?: string | null;
  }> | null;
} | null;

@Injectable()
export class ReportesCajaService {
  constructor(private readonly prisma: PrismaService) {}

  async getRendicionCuentas(
    tenantId: bigint,
    userId: bigint,
    query: QueryRendicionCuentasDto,
  ): Promise<RendicionCuentasResponseDto> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const idJunta = BigInt(query.idJunta);

      try {
        const rows = await tx.$queryRaw<ReporteRow[]>(
          Prisma.sql`SELECT fn_reporte_rendicion_cuentas(${idJunta}) AS reporte`,
        );
        return this.toResponse(rows[0]?.reporte);
      } catch (error) {
        this.handleFunctionError(error);
        throw error;
      }
    });
  }

  private async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.withTenantContext(userId, tenantId, async (tx) => {
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

  private handleFunctionError(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      const message = error.message ?? '';

      if (message.includes('No existe la junta o no pertenece al tenant actual')) {
        throw new NotFoundException(
          'No se encontro la junta directiva indicada en el tenant activo.',
        );
      }

      if (message.includes('No se ha configurado app.tenant_id en la sesión')) {
        throw new BadRequestException(
          'No se pudo generar el reporte porque falta contexto de tenant en la sesion.',
        );
      }
    }
  }

  private toResponse(payload: ReporteRendicionCuentasDb): RendicionCuentasResponseDto {
    const periodo = payload?.periodo ?? {};
    const resumen = payload?.resumen ?? {};
    const porCategoria = Array.isArray(payload?.porCategoria) ? payload.porCategoria : [];
    const detalleMovimientos = Array.isArray(payload?.detalleMovimientos)
      ? payload.detalleMovimientos
      : [];

    return {
      periodo: {
        fechaInicio: this.toDateString(periodo.fechaInicio),
        fechaFin: this.toDateString(periodo.fechaFin),
      },
      resumen: {
        saldoInicial: this.toNumber(resumen.saldoInicial),
        totalIngresos: this.toNumber(resumen.totalIngresos),
        totalGastos: this.toNumber(resumen.totalGastos),
        saldoFinal: this.toNumber(resumen.saldoFinal),
      },
      porCategoria: porCategoria.map((item): RendicionCuentasCategoriaDto => ({
        tipo: item.tipo ?? null,
        categoria: item.categoria ?? null,
        total: this.toNumber(item.total),
      })),
      detalleMovimientos: detalleMovimientos.map(
        (item): RendicionCuentasDetalleMovimientoDto => ({
          fecha: this.toDateString(item.fecha),
          tipo: item.tipo ?? null,
          categoria: item.categoria ?? null,
          descripcion: item.descripcion ?? null,
          monto: this.toNumber(item.monto),
          medioPago: item.medio_pago ?? null,
          docReferencia: item.doc_referencia ?? null,
        }),
      ),
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return typeof value === 'number' ? value : Number(value);
  }

  private toDateString(value: string | Date | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return value.length >= 10 ? value.slice(0, 10) : value;
    }

    return value.toISOString().slice(0, 10);
  }
}
