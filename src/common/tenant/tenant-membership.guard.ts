import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { getUserIdFromRequest } from '../auth/get-user-id-from-request';
import { getTenantIdFromHeader } from './get-tenant-id-from-header';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = getTenantIdFromHeader(request);
    const userId = getUserIdFromRequest(request);

    const membership = await this.prisma.withTenantContext(
      userId,
      tenantId,
      (tx) => tx.tenant_users.findFirst({
        where: {
          id_tenant: tenantId,
          id_user: userId,
          estado: 'ACTIVO',
        },
        select: {
          role: true,
        },
      }),
    );

    if (!membership) {
      throw new ForbiddenException('El usuario no pertenece al tenant activo.');
    }

    const enrichedRequest = request as Request & {
      tenantId?: bigint;
      userId?: bigint;
      membershipRole?: string;
    };

    enrichedRequest.tenantId = tenantId;
    enrichedRequest.userId = userId;
    enrichedRequest.membershipRole = membership.role;

    return true;
  }
}
