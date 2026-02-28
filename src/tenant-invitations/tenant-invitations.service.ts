import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantInvitationDto } from './dto/create-tenant-invitation.dto';
import { TenantInvitationResponseDto } from './dto/tenant-invitation-response.dto';

type TenantMembership = {
  id_tenant: bigint;
  id_user: bigint;
  role: string;
  estado: string;
};

type AuthUserIdentity = {
  id_user: bigint;
  email: string;
};

@Injectable()
export class TenantInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateTenantInvitationDto,
  ): Promise<TenantInvitationResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    this.ensureInvitationRoleIsValid(dto.role);

    return this.withUserContext(userId, async (tx) => {
      const membership = await this.getMembershipOrThrow(tx, tenantId, userId);
      this.assertCanInvite(membership.role, dto.role);

      const existing = await tx.tenant_invitations.findFirst({
        where: {
          id_tenant: tenantId,
          email: normalizedEmail,
          status: 'PENDING',
          expires_at: { gt: new Date() },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe una invitacion activa para ese email en este tenant.',
        );
      }

      const invitation = await tx.tenant_invitations.create({
        data: {
          id_tenant: tenantId,
          email: normalizedEmail,
          role: dto.role,
          token: randomBytes(32).toString('base64url'),
          status: 'PENDING',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
          invited_by: userId,
        },
      });

      return this.toResponse(invitation);
    });
  }

  async listMine(userId: bigint): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);

      const invitations = await tx.tenant_invitations.findMany({
        where: {
          email: authUser.email,
          status: 'PENDING',
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      return invitations.map((invitation) => this.toResponse(invitation));
    });
  }

  async accept(invitationId: bigint, userId: bigint): Promise<TenantInvitationResponseDto> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);
      const invitation = await this.getInvitationOrThrow(tx, invitationId);

      this.assertInvitationBelongsToUser(invitation.email, authUser.email);
      this.assertInvitationPending(invitation.status);
      this.assertInvitationNotExpired(invitation.expires_at);

      const existingMembership = await tx.tenant_users.findFirst({
        where: {
          id_tenant: invitation.id_tenant,
          id_user: userId,
        },
      });

      if (existingMembership) {
        throw new ConflictException('El usuario ya pertenece a este tenant.');
      }

      await tx.tenant_users.create({
        data: {
          id_tenant: invitation.id_tenant,
          id_user: userId,
          role: invitation.role,
          estado: 'ACTIVO',
          invited_by: invitation.invited_by,
        },
      });

      const updatedInvitation = await tx.tenant_invitations.update({
        where: { id_invitation: invitationId },
        data: { status: 'ACCEPTED' },
      });

      return this.toResponse(updatedInvitation);
    });
  }

  async reject(invitationId: bigint, userId: bigint): Promise<TenantInvitationResponseDto> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);
      const invitation = await this.getInvitationOrThrow(tx, invitationId);

      this.assertInvitationBelongsToUser(invitation.email, authUser.email);
      this.assertInvitationPending(invitation.status);

      const updatedInvitation = await tx.tenant_invitations.update({
        where: { id_invitation: invitationId },
        data: { status: 'REVOKED' },
      });

      return this.toResponse(updatedInvitation);
    });
  }

  async listByTenant(tenantId: bigint, userId: bigint): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const membership = await this.getMembershipOrThrow(tx, tenantId, userId);
      this.assertOwnerOrAdmin(membership.role);

      const invitations = await tx.tenant_invitations.findMany({
        where: { id_tenant: tenantId },
        orderBy: { created_at: 'desc' },
      });

      return invitations.map((invitation) => this.toResponse(invitation));
    });
  }

  parseBigIntId(id: string, fieldName: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`${fieldName} debe ser un numero entero positivo.`);
    }
    return BigInt(id);
  }

  private async withUserContext<T>(
    userId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`,
        );
        return fn(tx);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  private async getMembershipOrThrow(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    userId: bigint,
  ): Promise<TenantMembership> {
    const membership = await tx.tenant_users.findFirst({
      where: {
        id_tenant: tenantId,
        id_user: userId,
        estado: 'ACTIVO',
      },
      select: {
        id_tenant: true,
        id_user: true,
        role: true,
        estado: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('El usuario no pertenece a este tenant.');
    }

    return membership;
  }

  private async getAuthUserOrThrow(
    tx: Prisma.TransactionClient,
    userId: bigint,
  ): Promise<AuthUserIdentity> {
    const authUser = await tx.auth_users.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        email: true,
      },
    });

    if (!authUser) {
      throw new NotFoundException('No se encontro el usuario autenticado.');
    }

    return authUser;
  }

  private async getInvitationOrThrow(tx: Prisma.TransactionClient, invitationId: bigint) {
    const invitation = await tx.tenant_invitations.findUnique({
      where: { id_invitation: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('No se encontro la invitacion solicitada.');
    }

    return invitation;
  }

  private assertCanInvite(actorRole: string, invitedRole: string): void {
    if (actorRole === 'OWNER') {
      return;
    }

    if (actorRole === 'ADMIN' && invitedRole === 'MEMBER') {
      return;
    }

    throw new ForbiddenException('No tiene permisos para crear esta invitacion.');
  }

  private assertOwnerOrAdmin(role: string): void {
    if (role === 'OWNER' || role === 'ADMIN') {
      return;
    }

    throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
  }

  private assertInvitationBelongsToUser(invitationEmail: string, authUserEmail: string): void {
    if (invitationEmail !== authUserEmail) {
      throw new ForbiddenException('La invitacion no pertenece al usuario autenticado.');
    }
  }

  private assertInvitationPending(status: string): void {
    if (status !== 'PENDING') {
      throw new ConflictException('La invitacion ya fue procesada o no esta disponible.');
    }
  }

  private assertInvitationNotExpired(expiresAt: Date): void {
    if (expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('La invitacion ha expirado.');
    }
  }

  private ensureInvitationRoleIsValid(role: string): void {
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      throw new BadRequestException('role solo admite ADMIN o MEMBER.');
    }
  }

  private normalizeEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new BadRequestException('email es obligatorio.');
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('email es obligatorio.');
    }

    return normalized;
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('La invitacion o membresia ya existe.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('La relacion referencial de la invitacion es invalida.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el registro solicitado.');
      }
    }
  }

  private toResponse(invitation: {
    id_invitation: bigint;
    id_tenant: bigint;
    email: string;
    role: string;
    status: string;
    expires_at: Date;
    invited_by: bigint;
    created_at: Date;
  }): TenantInvitationResponseDto {
    return {
      idInvitation: Number(invitation.id_invitation),
      idTenant: invitation.id_tenant.toString(),
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      invitedBy: Number(invitation.invited_by),
      createdAt: invitation.created_at,
    };
  }
}
