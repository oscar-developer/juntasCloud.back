import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportesTenantBaseService } from '../reportes-tenant-base.service';

type JsonResultRow = {
  reporte: unknown | null;
};

@Injectable()
export class TopService extends ReportesTenantBaseService {
  async getTopDeudores(
    tenantId: bigint,
    userId: bigint,
    limite = 10,
  ): Promise<unknown> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const rows = await tx.$queryRaw<JsonResultRow[]>(
          Prisma.sql`SELECT fn_top_deudores(${tenantId}, ${limite}) AS reporte`,
        );
        return this.unwrapJsonValue(rows[0]?.reporte, []);
      } catch (error) {
        this.handleFunctionError(error);
        throw error;
      }
    });
  }

  private handleFunctionError(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      const message = error.message ?? '';

      if (message.includes('app.tenant_id')) {
        throw new BadRequestException(
          'No se pudo generar el reporte porque falta contexto de tenant en la sesion.',
        );
      }
    }
  }
}
