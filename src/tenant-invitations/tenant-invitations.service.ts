import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
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

type InvitationRecord = {
  id_invitation: bigint;
  id_tenant: bigint;
  email: string;
  role: string;
  status: string;
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  invited_by: bigint;
  created_at: Date;
};

@Injectable()
export class TenantInvitationsService {
  private static readonly STATUS_PRIORITY: Record<string, number> = {
    PENDING: 0,
    ACCEPTED: 1,
    REVOKED: 2,
    EXPIRED: 3,
  };

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
      const now = new Date();

      await this.expirePendingInvitations(tx, tenantId, normalizedEmail, now);

      const existing = await tx.tenant_invitations.findFirst({
        where: {
          id_tenant: tenantId,
          email: normalizedEmail,
          status: 'PENDING',
          expires_at: { gt: now },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe una invitacion activa para ese email en este tenant.',
        );
      }

      const tokenHash = this.hashToken(randomBytes(32).toString('base64url'));

      const invitation = await tx.tenant_invitations.create({
        data: {
          id_tenant: tenantId,
          email: normalizedEmail,
          role: dto.role,
          token_hash: tokenHash,
          status: 'PENDING',
          expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000),
          invited_by: userId,
        },
      });

      return this.toResponse(invitation);
    });
  }

  async listMine(userId: bigint): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);
      const now = new Date();

      const invitations = await tx.tenant_invitations.findMany({
        where: {
          email: authUser.email,
        },
        orderBy: { created_at: 'desc' },
      });

      const ordered = this.sortByStatusPriorityAndDate(invitations, now);
      return ordered.map((invitation) => this.toResponse(invitation, now));
    });
  }

  async accept(
    invitationId: bigint,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);
      const invitation = await this.getActiveInvitationOrThrow(tx, invitationId);

      this.assertInvitationBelongsToUser(invitation.email, authUser.email);

      const existingMembership = await tx.tenant_users.findFirst({
        where: {
          id_tenant: invitation.id_tenant,
          id_user: userId,
        },
      });

      if (existingMembership) {
        throw new ConflictException('El usuario ya pertenece a este tenant.');
      }

      const now = new Date();

      await tx.tenant_users.create({
        data: {
          id_tenant: invitation.id_tenant,
          id_user: userId,
          role: invitation.role,
          estado: 'ACTIVO',
          accepted_at: now,
          invited_by: invitation.invited_by,
        },
      });

      const updatedInvitation = await tx.tenant_invitations.update({
        where: { id_invitation: invitationId },
        data: {
          status: 'ACCEPTED',
          accepted_at: now,
        },
      });

      return this.toResponse(updatedInvitation);
    });
  }

  async reject(
    invitationId: bigint,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto> {
    return this.withUserContext(userId, async (tx) => {
      const authUser = await this.getAuthUserOrThrow(tx, userId);
      const invitation = await this.getActiveInvitationOrThrow(tx, invitationId);

      this.assertInvitationBelongsToUser(invitation.email, authUser.email);
      const now = new Date();

      const updatedInvitation = await tx.tenant_invitations.update({
        where: { id_invitation: invitationId },
        data: {
          status: 'REVOKED',
          revoked_at: now,
        },
      });

      return this.toResponse(updatedInvitation);
    });
  }

  async listByTenant(
    tenantId: bigint,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const membership = await this.getMembershipOrThrow(tx, tenantId, userId);
      this.assertOwnerOrAdmin(membership.role);
      const now = new Date();

      const invitations = await tx.tenant_invitations.findMany({
        where: { id_tenant: tenantId },
        orderBy: { created_at: 'desc' },
      });

      const ordered = this.sortByStatusPriorityAndDate(invitations, now);
      return ordered.map((invitation) => this.toResponse(invitation, now));
    });
  }

  async listSentMine(userId: bigint): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const now = new Date();

      const invitations = await tx.tenant_invitations.findMany({
        where: {
          invited_by: userId,
        },
        orderBy: { created_at: 'desc' },
      });

      const ordered = this.sortByStatusPriorityAndDate(invitations, now);
      return ordered.map((invitation) => this.toResponse(invitation, now));
    });
  }

  parseBigIntId(id: string, fieldName: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        `${fieldName} debe ser un numero entero positivo.`,
      );
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

  private async getInvitationOrThrow(
    tx: Prisma.TransactionClient,
    invitationId: bigint,
  ): Promise<InvitationRecord> {
    const invitation = await tx.tenant_invitations.findUnique({
      where: { id_invitation: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('No se encontro la invitacion solicitada.');
    }

    return invitation;
  }

  private async getActiveInvitationOrThrow(
    tx: Prisma.TransactionClient,
    invitationId: bigint,
  ): Promise<InvitationRecord> {
    const invitation = await this.getInvitationOrThrow(tx, invitationId);
    const currentInvitation = await this.expirePendingInvitationIfNeeded(tx, invitation);

    this.assertInvitationPending(currentInvitation.status);
    this.assertInvitationNotExpired(currentInvitation.expires_at);

    return currentInvitation;
  }

  private assertCanInvite(actorRole: string, invitedRole: string): void {
    if (actorRole === 'OWNER') {
      return;
    }

    if (actorRole === 'ADMIN' && invitedRole === 'MEMBER') {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para crear esta invitacion.',
    );
  }

  private assertOwnerOrAdmin(role: string): void {
    if (role === 'OWNER' || role === 'ADMIN') {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos suficientes para esta operacion.',
    );
  }

  private assertInvitationBelongsToUser(
    invitationEmail: string,
    authUserEmail: string,
  ): void {
    if (invitationEmail !== authUserEmail) {
      throw new ForbiddenException(
        'La invitacion no pertenece al usuario autenticado.',
      );
    }
  }

  private assertInvitationPending(status: string): void {
    if (status === 'EXPIRED') {
      throw new ConflictException('La invitacion ha expirado.');
    }

    if (status !== 'PENDING') {
      throw new ConflictException(
        'La invitacion ya fue procesada o no esta disponible.',
      );
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

  private async expirePendingInvitations(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    email: string,
    now: Date,
  ): Promise<void> {
    await tx.tenant_invitations.updateMany({
      where: {
        id_tenant: tenantId,
        email,
        status: 'PENDING',
        expires_at: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });
  }

  private async expirePendingInvitationIfNeeded(
    tx: Prisma.TransactionClient,
    invitation: InvitationRecord,
  ): Promise<InvitationRecord> {
    if (invitation.status !== 'PENDING') {
      return invitation;
    }

    if (invitation.expires_at.getTime() > Date.now()) {
      return invitation;
    }

    await tx.tenant_invitations.update({
      where: { id_invitation: invitation.id_invitation },
      data: { status: 'EXPIRED' },
    });

    throw new ConflictException('La invitacion ha expirado.');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe una invitacion pendiente para ese email en este tenant.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'La relacion referencial de la invitacion es invalida.',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el registro solicitado.');
      }
    }
  }

  private sortByStatusPriorityAndDate(
    invitations: InvitationRecord[],
    now: Date,
  ): InvitationRecord[] {
    return [...invitations].sort((a, b) => {
      const statusA = this.resolveEffectiveStatus(a.status, a.expires_at, now);
      const statusB = this.resolveEffectiveStatus(b.status, b.expires_at, now);

      const priorityA = this.getStatusPriority(statusA);
      const priorityB = this.getStatusPriority(statusB);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return b.created_at.getTime() - a.created_at.getTime();
    });
  }

  private getStatusPriority(status: string): number {
    const priority = TenantInvitationsService.STATUS_PRIORITY[status];
    return priority ?? Number.MAX_SAFE_INTEGER;
  }

  private resolveEffectiveStatus(
    status: string,
    expiresAt: Date,
    now: Date,
  ): string {
    if (status === 'PENDING' && expiresAt.getTime() <= now.getTime()) {
      return 'EXPIRED';
    }
    return status;
  }

  private toResponse(
    invitation: InvitationRecord,
    now: Date = new Date(),
  ): TenantInvitationResponseDto {
    const effectiveStatus = this.resolveEffectiveStatus(
      invitation.status,
      invitation.expires_at,
      now,
    );

    return {
      idInvitation: Number(invitation.id_invitation),
      idTenant: Number(invitation.id_tenant),
      email: invitation.email,
      role: invitation.role,
      status: effectiveStatus,
      expiresAt: invitation.expires_at,
      acceptedAt: invitation.accepted_at,
      revokedAt: invitation.revoked_at,
      invitedBy: Number(invitation.invited_by),
      createdAt: invitation.created_at,
    };
  }
}
