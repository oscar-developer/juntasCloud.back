import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  PersonaConstanciaEmitidaDto,
  PersonaConstanciaFirmanteDto,
  PersonaConstanciaSnapshotDto,
  PersonaConstanciaVerificacionDto,
} from './dto/persona-constancia-response.dto';

type JsonTextRow = {
  reporte: string | null;
};

type IssuedRow = {
  id_constancia: bigint;
  issued_at: Date;
};

type RevokedRow = {
  id_constancia: bigint | null;
};

const REQUIRED_SIGNERS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO'] as const;

@Injectable()
export class PersonaConstanciasService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
  ): Promise<PersonaConstanciaEmitidaDto> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hash(token);
    const codigo = this.createCode();

    return this.prisma.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureCanIssue(tx, tenantId, userId);

      const tenant = await tx.tenants.findUnique({
        where: { id_tenant: tenantId },
        select: {
          nombre: true,
          tipo_documento: true,
          numero_documento: true,
        },
      });
      const persona = await tx.personas.findUnique({
        where: {
          id_tenant_id_persona: {
            id_tenant: tenantId,
            id_persona: personaId,
          },
        },
        select: {
          id_persona: true,
          nombres: true,
          apellido_paterno: true,
          apellido_materno: true,
          dni: true,
          nro_padron: true,
          tipo_participante: true,
          estado: true,
          fecha_registro: true,
        },
      });

      if (!tenant || !persona) {
        throw new NotFoundException(
          'No se encontro la persona solicitada en el tenant activo.',
        );
      }

      const summaryRows = await tx.$queryRaw<JsonTextRow[]>(
        Prisma.sql`SELECT public.fn_persona_ficha(${tenantId}, ${personaId})::text AS reporte`,
      );
      const summary = this.parseJson<Record<string, unknown>>(
        summaryRows[0]?.reporte,
      );
      const totalTerrenos = await tx.persona_terreno.count({
        where: { id_tenant: tenantId, id_persona: personaId },
      });
      const junta = await tx.juntas_directivas.findFirst({
        where: { id_tenant: tenantId, estado: 'VIGENTE' },
        orderBy: { fecha_inicio: 'desc' },
        include: {
          junta_miembros: {
            where: {
              cargo: { in: [...REQUIRED_SIGNERS] },
              OR: [{ fecha_fin: null }, { fecha_fin: { gte: new Date() } }],
            },
            include: {
              personas: {
                select: {
                  nombres: true,
                  apellido_paterno: true,
                  apellido_materno: true,
                },
              },
            },
          },
        },
      });
      const snapshot = this.buildSnapshot(
        tenant,
        persona,
        summary,
        totalTerrenos,
        junta,
      );
      const snapshotText = JSON.stringify(snapshot);
      const snapshotHash = this.hash(snapshotText);
      const issuedRows = await tx.$queryRaw<IssuedRow[]>(Prisma.sql`
        SELECT id_constancia, issued_at
        FROM public.fn_emitir_persona_constancia(
          ${tenantId},
          ${personaId},
          ${codigo},
          ${tokenHash},
          ${snapshotText}::jsonb,
          ${snapshotHash}
        )
      `);
      const issued = issuedRows[0];

      if (!issued) {
        throw new BadRequestException('No se pudo registrar la constancia.');
      }

      return {
        idConstancia: Number(issued.id_constancia),
        codigo,
        estado: 'VIGENTE',
        issuedAt: issued.issued_at.toISOString(),
        verificationUrl: this.buildVerificationUrl(token),
        snapshotHash,
        snapshot,
      };
    });
  }

  async verify(token: string): Promise<PersonaConstanciaVerificacionDto> {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new NotFoundException('No se encontro la constancia solicitada.');
    }

    const rows = await this.prisma.$queryRaw<JsonTextRow[]>(
      Prisma.sql`SELECT public.fn_verificar_persona_constancia(${this.hash(token)})::text AS reporte`,
    );
    const verification =
      this.parseJson<PersonaConstanciaVerificacionDto | null>(rows[0]?.reporte);

    if (!verification) {
      throw new NotFoundException('No se encontro la constancia solicitada.');
    }

    return verification;
  }

  async revoke(
    tenantId: bigint,
    userId: bigint,
    personaId: bigint,
    constanciaId: bigint,
    motivo: string,
  ): Promise<void> {
    const normalizedReason = motivo.trim();
    if (!normalizedReason) {
      throw new BadRequestException('El motivo de revocacion es obligatorio.');
    }

    await this.prisma.withTenantContext(userId, tenantId, async (tx) => {
      await this.ensureCanIssue(tx, tenantId, userId);
      const rows = await tx.$queryRaw<RevokedRow[]>(Prisma.sql`
        SELECT public.fn_revocar_persona_constancia(
          ${tenantId},
          ${personaId},
          ${constanciaId},
          ${normalizedReason}
        ) AS id_constancia
      `);

      if (!rows[0]?.id_constancia) {
        throw new NotFoundException(
          'La constancia no existe o ya fue revocada.',
        );
      }
    });
  }

  parseId(value: string, field: string): bigint {
    if (!/^\d+$/.test(value) || value === '0') {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }

    return BigInt(value);
  }

  private async ensureCanIssue(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    userId: bigint,
  ): Promise<void> {
    const membership = await tx.tenant_users.findFirst({
      where: {
        id_tenant: tenantId,
        id_user: userId,
        estado: 'ACTIVO',
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: { id_user: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'No tiene permisos para emitir constancias.',
      );
    }
  }

  private buildSnapshot(
    tenant: {
      nombre: string;
      tipo_documento: string | null;
      numero_documento: string | null;
    },
    persona: {
      id_persona: bigint;
      nombres: string;
      apellido_paterno: string;
      apellido_materno: string;
      dni: string | null;
      nro_padron: number | null;
      tipo_participante: string;
      estado: string;
      fecha_registro: Date;
    },
    summary: Record<string, unknown>,
    totalTerrenos: number,
    junta: {
      id_junta: bigint;
      nombre: string;
      fecha_inicio: Date;
      fecha_fin: Date | null;
      junta_miembros: Array<{
        cargo: string;
        personas: {
          nombres: string;
          apellido_paterno: string;
          apellido_materno: string;
        };
      }>;
    } | null,
  ): PersonaConstanciaSnapshotDto {
    const resumenFinanciero = this.asRecord(summary.resumenFinanciero);
    const resumenFaenas = this.asRecord(summary.resumenFaenas);
    const resumenAsambleas = this.asRecord(summary.resumenAsambleas);
    const firmantes = REQUIRED_SIGNERS.map<PersonaConstanciaFirmanteDto>(
      (cargo) => {
        const member = junta?.junta_miembros.find(
          (item) => item.cargo === cargo,
        );

        return {
          cargo,
          nombreCompleto: member ? this.fullName(member.personas) : null,
        };
      },
    );

    return {
      tenant: {
        nombre: tenant.nombre,
        tipoDocumento: tenant.tipo_documento,
        numeroDocumento: tenant.numero_documento,
      },
      persona: {
        idPersona: Number(persona.id_persona),
        nombreCompleto: this.fullName(persona),
        dni: persona.dni,
        nroPadron: persona.nro_padron,
        tipoParticipante: persona.tipo_participante,
        estado: persona.estado,
        fechaRegistro: persona.fecha_registro.toISOString().slice(0, 10),
      },
      resumen: {
        deudaPendienteTotal: this.numberValue(
          resumenFinanciero.deudaPendienteTotal,
        ),
        faenas: this.mapAttendance(resumenFaenas),
        asambleas: this.mapAttendance(resumenAsambleas),
        totalTerrenos,
      },
      juntaDirectiva: {
        idJunta: junta ? Number(junta.id_junta) : null,
        nombre: junta?.nombre ?? null,
        fechaInicio: junta?.fecha_inicio.toISOString().slice(0, 10) ?? null,
        fechaFin: junta?.fecha_fin?.toISOString().slice(0, 10) ?? null,
      },
      firmantes,
    };
  }

  private mapAttendance(value: Record<string, unknown>) {
    return {
      total: this.numberValue(value.total),
      asistencias: this.numberValue(value.asistencias),
      faltas: this.numberValue(value.faltas),
      tardanzas: this.numberValue(value.tardanzas),
      porcentajeAsistencia: this.numberValue(value.porcentajeAsistencia),
    };
  }

  private fullName(persona: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
  }): string {
    return [persona.apellido_paterno, persona.apellido_materno, persona.nombres]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
  }

  private createCode(): string {
    const date = new Date();
    const compactDate = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('');

    return `CP-${compactDate}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private buildVerificationUrl(token: string): string {
    const baseUrl = process.env.FRONTEND_BASE_URL?.trim();
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'No se configuro FRONTEND_BASE_URL para verificar constancias.',
      );
    }

    return new URL(`/verificar/constancia/${token}`, baseUrl).toString();
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private parseJson<T>(value: string | null | undefined): T {
    if (!value) {
      return null as T;
    }

    return JSON.parse(value) as T;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }

  private numberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
