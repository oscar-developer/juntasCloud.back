import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportesTenantBaseService } from '../reportes-tenant-base.service';

type JsonResultRow = {
  reporte: unknown | null;
};

@Injectable()
export class DeudasPersonaService extends ReportesTenantBaseService {
  async getExtracto(tenantId: bigint, userId: bigint, personaId: bigint): Promise<unknown> {
    return this.executePersonaFunction('fn_persona_extracto', tenantId, userId, personaId);
  }

  async getDeuda(tenantId: bigint, userId: bigint, personaId: bigint): Promise<unknown> {
    return this.executePersonaFunction('fn_deuda_por_persona', tenantId, userId, personaId);
  }

  async getFaenas(tenantId: bigint, userId: bigint, personaId: bigint): Promise<unknown> {
    return this.executePersonaFunction('fn_faena_resumen_persona', tenantId, userId, personaId);
  }

  async getAsambleas(tenantId: bigint, userId: bigint, personaId: bigint): Promise<unknown> {
    return this.executePersonaFunction(
      'fn_asamblea_resumen_persona',
      tenantId,
      userId,
      personaId,
    );
  }

  parseId(id: string, fieldName: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`${fieldName} debe ser un entero positivo.`);
    }
    return BigInt(id);
  }

  private async executePersonaFunction(
    functionName:
      | 'fn_persona_extracto'
      | 'fn_deuda_por_persona'
      | 'fn_faena_resumen_persona'
      | 'fn_asamblea_resumen_persona',
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
  ): Promise<unknown> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
      try {
        const query = this.buildPersonaFunctionQuery(functionName, tenantId, personaId);
        const rows = await tx.$queryRaw<JsonResultRow[]>(query);
        return this.unwrapJsonValue(rows[0]?.reporte, {});
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

  private buildPersonaFunctionQuery(
    functionName:
      | 'fn_persona_extracto'
      | 'fn_deuda_por_persona'
      | 'fn_faena_resumen_persona'
      | 'fn_asamblea_resumen_persona',
    tenantId: bigint,
    personaId: bigint,
  ) {
    switch (functionName) {
      case 'fn_persona_extracto':
        return Prisma.sql`SELECT fn_persona_extracto(${tenantId}, ${personaId}) AS reporte`;
      case 'fn_deuda_por_persona':
        return Prisma.sql`SELECT fn_deuda_por_persona(${tenantId}, ${personaId}) AS reporte`;
      case 'fn_faena_resumen_persona':
        return Prisma.sql`SELECT fn_faena_resumen_persona(${tenantId}, ${personaId}) AS reporte`;
      case 'fn_asamblea_resumen_persona':
        return Prisma.sql`SELECT fn_asamblea_resumen_persona(${tenantId}, ${personaId}) AS reporte`;
    }
  }
}
