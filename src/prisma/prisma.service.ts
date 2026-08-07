import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: PrismaService.buildConnectionString(),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withUserContext<T>(
    userId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await this.setUserContext(tx, userId);
      return fn(tx);
    });
  }

  async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await this.setUserContext(tx, userId);
      await this.setTenantContext(tx, tenantId);
      return fn(tx);
    });
  }

  private async setUserContext(
    tx: Prisma.TransactionClient,
    userId: bigint,
  ): Promise<void> {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
    );
  }

  private async setTenantContext(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
  ): Promise<void> {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`,
    );
  }

  private static buildConnectionString(): string {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

    if (!DB_HOST || !DB_PORT || !DB_USER || DB_PASSWORD === undefined || !DB_NAME) {
      throw new Error(
        'Faltan variables de entorno DB_HOST, DB_PORT, DB_USER, DB_PASSWORD o DB_NAME.',
      );
    }

    return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
}
