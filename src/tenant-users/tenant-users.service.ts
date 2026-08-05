import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryTenantUsersDto,
  TENANT_USER_ESTADOS,
  TENANT_USER_ROLES,
  TenantUserEstado,
  TenantUserRole,
} from './dto/query-tenant-users.dto';
import { TenantUserResponseDto } from './dto/tenant-user-response.dto';

type TenantUserListRow = {
  id_tenant: bigint;
  id_user: bigint;
  role: string;
  estado: string;
  joined_at: Date;
  ended_at: Date | null;
  invited_by: bigint | null;
  id_persona: bigint | null;
  id_profile: bigint | null;
  auth_users_tenant_users_id_userToauth_users: {
    nombres: string;
    apellidos: string;
  };
};

@Injectable()
export class TenantUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryTenantUsersDto = {},
  ): Promise<TenantUserResponseDto[]> {
    const estado = this.normalizeEstado(query.estado);
    const role = this.normalizeRole(query.role);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      const rows = await tx.tenant_users.findMany({
        where: {
          id_tenant: tenantId,
          estado,
          role: role ?? undefined,
        },
        select: {
          id_tenant: true,
          id_user: true,
          role: true,
          estado: true,
          joined_at: true,
          ended_at: true,
          invited_by: true,
          id_persona: true,
          id_profile: true,
          auth_users_tenant_users_id_userToauth_users: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'desc' },
          { id_user: 'asc' },
        ],
        skip,
        take: limit,
      });

      return rows.map((row) => this.toResponse(row));
    });
  }

  parseId(id: string, fieldName: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`${fieldName} debe ser un entero positivo.`);
    }
    return BigInt(id);
  }

  private async withTenantAdminContext<T>(
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
        where: {
          id_tenant: tenantId,
          id_user: userId,
          estado: 'ACTIVO',
        },
        select: {
          id_user: true,
          role: true,
          id_profile: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('El usuario no pertenece al tenant activo.');
      }

      if (
        membership.role !== 'OWNER' &&
        membership.role !== 'ADMIN' &&
        !(await this.hasFullAccessToAdminRoles(tx, tenantId, membership.id_profile))
      ) {
        throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
      }

      return fn(tx);
    });
  }

  private async hasFullAccessToAdminRoles(
    tx: Prisma.TransactionClient,
    _tenantId: bigint,
    profileId: bigint | null,
  ): Promise<boolean> {
    if (!profileId) {
      return false;
    }

    const permission = await tx.tenant_profile_modules.findUnique({
      where: {
        id_profile_module_code: {
          id_profile: profileId,
          module_code: 'admin_roles',
        },
      },
      select: { access_level: true },
    });

    return permission?.access_level === 'ACCESO_TOTAL';
  }

  private normalizeEstado(value: TenantUserEstado | undefined): TenantUserEstado {
    if (value === undefined) {
      return 'ACTIVO';
    }
    if (!TENANT_USER_ESTADOS.includes(value)) {
      throw new BadRequestException(
        `estado solo admite ${TENANT_USER_ESTADOS.join(', ')}.`,
      );
    }
    return value;
  }

  private normalizeRole(value: TenantUserRole | undefined): TenantUserRole | null {
    if (value === undefined) {
      return null;
    }
    if (!TENANT_USER_ROLES.includes(value)) {
      throw new BadRequestException(`role solo admite ${TENANT_USER_ROLES.join(', ')}.`);
    }
    return value;
  }

  private toResponse(row: TenantUserListRow): TenantUserResponseDto {
    return {
      idTenant: Number(row.id_tenant),
      idUser: Number(row.id_user),
      role: row.role,
      estado: row.estado,
      joinedAt: row.joined_at,
      endedAt: row.ended_at,
      invitedBy: row.invited_by === null ? null : Number(row.invited_by),
      idPersona: row.id_persona === null ? null : Number(row.id_persona),
      idProfile: row.id_profile === null ? null : Number(row.id_profile),
      nombres: row.auth_users_tenant_users_id_userToauth_users.nombres,
      apellidos: row.auth_users_tenant_users_id_userToauth_users.apellidos,
    };
  }
}
