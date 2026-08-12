import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportesTenantBaseService } from '../reportes-tenant-base.service';

type DashboardRow = {
  reporte: string | null;
};

type DashboardGeneral = {
  caja: {
    saldoActual: number;
  };
  personas: {
    total: number;
    padronados: number;
  };
  obligaciones: {
    pendientes: number;
    deudaTotal: number;
  };
  faenas: {
    programadas: number;
  };
  asambleas: {
    proximas: number;
  };
};

@Injectable()
export class DashboardService extends ReportesTenantBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getDashboardGeneral(
    tenantId: bigint,
    userId: bigint,
  ): Promise<DashboardGeneral> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      const rows = await tx.$queryRaw<DashboardRow[]>(
        Prisma.sql`SELECT public.fn_dashboard_general(${tenantId})::text AS reporte`,
      );

      return this.parseDashboard(rows[0]?.reporte);
    });
  }

  private parseDashboard(value: string | null | undefined): DashboardGeneral {
    if (!value) {
      return this.emptyDashboard();
    }

    return JSON.parse(value) as DashboardGeneral;
  }

  private emptyDashboard(): DashboardGeneral {
    return {
      caja: { saldoActual: 0 },
      personas: { total: 0, padronados: 0 },
      obligaciones: { pendientes: 0, deudaTotal: 0 },
      faenas: { programadas: 0 },
      asambleas: { proximas: 0 },
    };
  }
}
