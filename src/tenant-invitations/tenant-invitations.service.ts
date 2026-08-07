import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantInvitationDto } from './dto/create-tenant-invitation.dto';
import { TenantInvitationResponseDto } from './dto/tenant-invitation-response.dto';

type InvitationRecord = {
  id_invitation: bigint;
  id_tenant: bigint;
  email: string;
  role: string;
  id_profile: bigint | null;
  status: string;
  expires_at: Date;
  accepted_at: Date | null;
  rejected_at: Date | null;
  revoked_at: Date | null;
  invited_by: bigint;
  message: string | null;
  created_at: Date;
};

@Injectable()
export class TenantInvitationsService {
  private static readonly STATUS_PRIORITY: Record<string, number> = {
    PENDING: 0,
    ACCEPTED: 1,
    REJECTED: 2,
    REVOKED: 3,
    EXPIRED: 4,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateTenantInvitationDto,
  ): Promise<TenantInvitationResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const role = this.normalizeInvitationRole(dto.role);
    const idProfile = this.normalizeOptionalNumberId(dto.idProfile, 'idProfile');
    const expiresInDays = dto.expiresInDays ?? 7;
    const message = this.normalizeOptionalText(dto.message, 'message');
    let plainToken = '';

    try {
      const invitation = await this.withTenantContext(userId, tenantId, async (tx) => {
        const rows = await tx.$queryRaw<{ token: string }[]>(
          Prisma.sql`
            SELECT public.create_tenant_invitation(
              ${tenantId},
              ${normalizedEmail},
              ${role},
              ${idProfile},
              ${expiresInDays},
              ${message}
            ) AS token
          `,
        );
        plainToken = rows[0]?.token ?? '';
        if (!plainToken) {
          throw new BadRequestException('No se pudo crear la invitacion.');
        }

        return this.getInvitationByTokenHashOrThrow(tx, this.hashToken(plainToken));
      });

      await this.mailService.sendTenantInvitation({
        email: invitation.email,
        token: plainToken,
        expiresInDays,
      });

      return this.toResponse(invitation);
    } catch (error) {
      this.handleKnownErrors(error);
      this.handleFunctionErrors(error);
      throw error;
    }
  }

  async listMine(userId: bigint): Promise<TenantInvitationResponseDto[]> {
    return this.withUserContext(userId, async (tx) => {
      const now = new Date();
      const invitations = await tx.tenant_invitations.findMany({
        orderBy: { created_at: 'desc' },
      });

      const ordered = this.sortByStatusPriorityAndDate(invitations, now);
      return ordered.map((invitation) => this.toResponse(invitation, now));
    });
  }

  async accept(
    token: string,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto> {
    const normalizedToken = this.normalizeToken(token);
    const tokenHash = this.hashToken(normalizedToken);

    try {
      return await this.withUserContext(userId, async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT public.accept_tenant_invitation(${normalizedToken})`,
        );
        const invitation = await this.getInvitationByTokenHashOrThrow(tx, tokenHash);
        return this.toResponse(invitation);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      this.handleFunctionErrors(error);
      throw error;
    }
  }

  async reject(
    token: string,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto> {
    const normalizedToken = this.normalizeToken(token);
    const tokenHash = this.hashToken(normalizedToken);

    try {
      return await this.withUserContext(userId, async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT public.reject_tenant_invitation(${normalizedToken})`,
        );
        const invitation = await this.getInvitationByTokenHashOrThrow(tx, tokenHash);
        return this.toResponse(invitation);
      });
    } catch (error) {
      this.handleKnownErrors(error);
      this.handleFunctionErrors(error);
      throw error;
    }
  }

  async listByTenant(
    tenantId: bigint,
    userId: bigint,
  ): Promise<TenantInvitationResponseDto[]> {
    return this.withTenantContext(userId, tenantId, async (tx) => {
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
    return this.prisma.withUserContext(userId, fn);
  }

  private async withTenantContext<T>(
    userId: bigint,
    tenantId: bigint,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.withTenantContext(userId, tenantId, fn);
  }

  private async getInvitationByTokenHashOrThrow(
    tx: Prisma.TransactionClient,
    tokenHash: string,
  ): Promise<InvitationRecord> {
    const invitation = await tx.tenant_invitations.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!invitation) {
      throw new NotFoundException('No se encontro la invitacion solicitada.');
    }

    return invitation;
  }

  private normalizeInvitationRole(role: string): 'ADMIN' | 'MEMBER' {
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      throw new BadRequestException('role solo admite ADMIN o MEMBER.');
    }
    return role;
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

  private normalizeToken(token: string): string {
    if (typeof token !== 'string') {
      throw new BadRequestException('token es obligatorio.');
    }
    const normalized = token.trim();
    if (!normalized) {
      throw new BadRequestException('token es obligatorio.');
    }
    return normalized;
  }

  private normalizeOptionalNumberId(
    value: number | null | undefined,
    fieldName: string,
  ): bigint | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} debe ser un entero positivo.`);
    }
    return BigInt(value);
  }

  private normalizeOptionalText(
    value: string | null | undefined,
    field: string,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    if (normalized.length > 500) {
      throw new BadRequestException(`${field} no debe superar 500 caracteres.`);
    }
    return normalized;
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

  private handleFunctionErrors(error: unknown): void {
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('permiso')) {
        throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
      }
      if (message.includes('correo verificado')) {
        throw new ForbiddenException('El usuario debe estar activo y tener el correo verificado.');
      }
      if (message.includes('expir')) {
        throw new ConflictException('La invitacion ha expirado.');
      }
      if (message.includes('no está disponible') || message.includes('no esta disponible')) {
        throw new ConflictException('La invitacion ya fue procesada o no esta disponible.');
      }
      if (message.includes('otro correo')) {
        throw new ForbiddenException('La invitacion no pertenece al usuario autenticado.');
      }
    }
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
      rejectedAt: invitation.rejected_at,
      invitedBy: Number(invitation.invited_by),
      createdAt: invitation.created_at,
    };
  }
}
