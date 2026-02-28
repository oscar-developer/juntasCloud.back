import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { getTenantIdFromHeader } from '../tenant/get-tenant-id-from-header';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { userId?: number } | undefined;
    if (!user?.userId || !Number.isInteger(user.userId) || user.userId <= 0) {
      throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
    }

    const tenantId = getTenantIdFromHeader(request);
    const userId = BigInt(user.userId);

    const membership = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
      );
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId.toString()}, true)`,
      );

      return tx.tenant_users.findFirst({
        where: {
          id_tenant: tenantId,
          id_user: userId,
          estado: 'ACTIVO',
        },
        select: {
          role: true,
        },
      });
    });

    if (!membership) {
      throw new ForbiddenException('El usuario no pertenece al tenant activo.');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
    }

    (request as Request & { tenantId?: bigint; membershipRole?: string }).tenantId = tenantId;
    (request as Request & { tenantId?: bigint; membershipRole?: string }).membershipRole =
      membership.role;

    return true;
  }
}
