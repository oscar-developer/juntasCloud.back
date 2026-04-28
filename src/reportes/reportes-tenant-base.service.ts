import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export abstract class ReportesTenantBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  protected async withTenantContext<T>(
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

  protected unwrapJsonValue<TFallback>(
    value: unknown,
    fallback: TFallback,
  ): unknown | TFallback {
    return value ?? fallback;
  }
}
