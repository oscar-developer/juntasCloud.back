import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { QueryTenantProfilesDto } from './dto/query-tenant-profiles.dto';
import {
  ACCESS_LEVELS,
  TenantProfileModuleConfigDto,
} from './dto/replace-tenant-profile-modules.dto';
import { TenantProfileModuleResponseDto } from './dto/tenant-profile-module-response.dto';
import { TenantProfileResponseDto } from './dto/tenant-profile-response.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';

type TenantProfileRecord = {
  id_tenant: bigint;
  id_profile: bigint;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  tenant_profile_modules?: { access_level: string }[];
};

type TenantProfileModuleRecord = {
  id_tenant: bigint;
  id_profile: bigint;
  module_code: string;
  access_level: string;
  app_modules: {
    module_code: string;
    nombre: string;
    grupo: string;
    orden: number;
    activo: boolean;
  };
};

type NormalizedModuleConfig = {
  moduleCode: string;
  accessLevel: (typeof ACCESS_LEVELS)[number];
};

@Injectable()
export class TenantProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: bigint,
    userId: bigint,
    dto: CreateTenantProfileDto,
  ): Promise<TenantProfileResponseDto> {
    const nombre = this.normalizeRequiredText(dto.nombre, 'nombre');
    const descripcion = this.normalizeOptionalText(dto.descripcion, 'descripcion');
    const modules = this.normalizeModules(dto.modules ?? []);

    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      await this.ensureProfileNameIsAvailable(tx, tenantId, nombre);
      await this.ensureModulesExist(tx, modules.map((module) => module.moduleCode));

      try {
        const profile = await tx.tenant_profiles.create({
          data: {
            id_tenant: tenantId,
            nombre,
            descripcion,
            activo: dto.activo ?? true,
          },
        });

        if (modules.length > 0) {
          await tx.tenant_profile_modules.createMany({
            data: modules.map((module) => ({
              id_tenant: tenantId,
              id_profile: profile.id_profile,
              module_code: module.moduleCode,
              access_level: module.accessLevel,
            })),
          });
        }

        const savedModules = await this.findProfileModules(tx, tenantId, profile.id_profile);

        return this.toProfileResponse(profile, savedModules, savedModules);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async findAll(
    tenantId: bigint,
    userId: bigint,
    query: QueryTenantProfilesDto = {},
  ): Promise<TenantProfileResponseDto[]> {
    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      const search = this.normalizeSearch(query.search);
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const where: Prisma.tenant_profilesWhereInput = {
        id_tenant: tenantId,
        activo: query.activo,
        OR: search
          ? [
              { nombre: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      };

      const profiles = await tx.tenant_profiles.findMany({
        where,
        include: {
          tenant_profile_modules: {
            select: { access_level: true },
          },
        },
        orderBy: { id_profile: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return profiles.map((profile) =>
        this.toProfileResponse(profile, profile.tenant_profile_modules),
      );
    });
  }

  async findOne(
    tenantId: bigint,
    userId: bigint,
    profileId: bigint,
  ): Promise<TenantProfileResponseDto> {
    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      const profile = await this.getProfileOrThrow(tx, tenantId, profileId);
      const modules = await this.findProfileModules(tx, tenantId, profileId);
      return this.toProfileResponse(profile, modules, modules);
    });
  }

  async update(
    tenantId: bigint,
    userId: bigint,
    profileId: bigint,
    dto: UpdateTenantProfileDto,
  ): Promise<TenantProfileResponseDto> {
    const nombre =
      dto.nombre !== undefined
        ? this.normalizeRequiredText(dto.nombre, 'nombre')
        : undefined;
    const descripcion = this.normalizeOptionalText(dto.descripcion, 'descripcion');

    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      await this.getProfileOrThrow(tx, tenantId, profileId);
      if (nombre !== undefined) {
        await this.ensureProfileNameIsAvailable(tx, tenantId, nombre, profileId);
      }

      try {
        const profile = await tx.tenant_profiles.update({
          where: {
            id_tenant_id_profile: {
              id_tenant: tenantId,
              id_profile: profileId,
            },
          },
          data: {
            nombre,
            descripcion,
            activo: dto.activo,
          },
        });

        return this.toProfileResponse(profile);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async remove(
    tenantId: bigint,
    userId: bigint,
    profileId: bigint,
  ): Promise<void> {
    await this.withTenantAdminContext(userId, tenantId, async (tx) => {
      await this.getProfileOrThrow(tx, tenantId, profileId);

      const assignedUser = await tx.tenant_users.findFirst({
        where: {
          id_tenant: tenantId,
          id_profile: profileId,
        },
        select: { id_user: true },
      });

      if (assignedUser) {
        throw new ConflictException(
          'No se puede eliminar el perfil porque esta asignado a usuarios del tenant.',
        );
      }

      try {
        await tx.tenant_profile_modules.deleteMany({
          where: {
            id_tenant: tenantId,
            id_profile: profileId,
          },
        });

        await tx.tenant_profiles.delete({
          where: {
            id_tenant_id_profile: {
              id_tenant: tenantId,
              id_profile: profileId,
            },
          },
        });
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async findModules(
    tenantId: bigint,
    userId: bigint,
    profileId: bigint,
  ): Promise<TenantProfileModuleResponseDto[]> {
    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      await this.getProfileOrThrow(tx, tenantId, profileId);

      const modules = await tx.tenant_profile_modules.findMany({
        where: {
          id_tenant: tenantId,
          id_profile: profileId,
        },
        include: { app_modules: true },
        orderBy: [{ app_modules: { orden: 'asc' } }, { module_code: 'asc' }],
      });

      return modules.map((module) => this.toModuleResponse(module));
    });
  }

  async replaceModules(
    tenantId: bigint,
    userId: bigint,
    profileId: bigint,
    dto: TenantProfileModuleConfigDto[],
  ): Promise<TenantProfileModuleResponseDto[]> {
    const modules = this.normalizeModules(dto);

    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      await this.getProfileOrThrow(tx, tenantId, profileId);
      await this.ensureModulesExist(tx, modules.map((module) => module.moduleCode));

      try {
        await tx.tenant_profile_modules.deleteMany({
          where: {
            id_tenant: tenantId,
            id_profile: profileId,
          },
        });

        if (modules.length > 0) {
          await tx.tenant_profile_modules.createMany({
            data: modules.map((module) => ({
              id_tenant: tenantId,
              id_profile: profileId,
              module_code: module.moduleCode,
              access_level: module.accessLevel,
            })),
          });
        }

        const savedModules = await this.findProfileModules(tx, tenantId, profileId);

        return savedModules.map((module) => this.toModuleResponse(module));
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
    });
  }

  async updateUserProfile(
    tenantId: bigint,
    userId: bigint,
    targetUserId: bigint,
    profileId: bigint,
  ): Promise<TenantProfileResponseDto> {
    return this.withTenantAdminContext(userId, tenantId, async (tx) => {
      const profile = await this.getProfileOrThrow(tx, tenantId, profileId);

      const targetMembership = await tx.tenant_users.findUnique({
        where: {
          id_tenant_id_user: {
            id_tenant: tenantId,
            id_user: targetUserId,
          },
        },
        select: {
          id_user: true,
          role: true,
          estado: true,
        },
      });

      if (!targetMembership || targetMembership.estado !== 'ACTIVO') {
        throw new NotFoundException('No se encontro el usuario activo en este tenant.');
      }

      if (targetMembership.role === 'OWNER') {
        throw new ForbiddenException('No se puede cambiar el perfil de un usuario OWNER.');
      }

      try {
        await tx.tenant_users.update({
          where: {
            id_tenant_id_user: {
              id_tenant: tenantId,
              id_user: targetUserId,
            },
          },
          data: {
            id_profile: profileId,
          },
        });

        return this.toProfileResponse(profile);
      } catch (error) {
        this.handleKnownErrors(error);
        throw error;
      }
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

  private async getProfileOrThrow(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    profileId: bigint,
  ): Promise<TenantProfileRecord> {
    const profile = await tx.tenant_profiles.findUnique({
      where: {
        id_tenant_id_profile: {
          id_tenant: tenantId,
          id_profile: profileId,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('No se encontro el perfil solicitado.');
    }

    return profile;
  }

  private async findProfileModules(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    profileId: bigint,
  ): Promise<TenantProfileModuleRecord[]> {
    return tx.tenant_profile_modules.findMany({
      where: {
        id_tenant: tenantId,
        id_profile: profileId,
      },
      include: { app_modules: true },
      orderBy: [{ app_modules: { orden: 'asc' } }, { module_code: 'asc' }],
    });
  }

  private async hasFullAccessToAdminRoles(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    profileId: bigint | null,
  ): Promise<boolean> {
    if (!profileId) {
      return false;
    }

    const permission = await tx.tenant_profile_modules.findUnique({
      where: {
        id_tenant_id_profile_module_code: {
          id_tenant: tenantId,
          id_profile: profileId,
          module_code: 'admin_roles',
        },
      },
      select: { access_level: true },
    });

    return permission?.access_level === 'ACCESO_TOTAL';
  }

  private async ensureProfileNameIsAvailable(
    tx: Prisma.TransactionClient,
    tenantId: bigint,
    nombre: string,
    currentProfileId?: bigint,
  ): Promise<void> {
    const existing = await tx.tenant_profiles.findFirst({
      where: {
        id_tenant: tenantId,
        nombre,
        id_profile: currentProfileId ? { not: currentProfileId } : undefined,
      },
      select: { id_profile: true },
    });

    if (existing) {
      throw new ConflictException('Ya existe un perfil con ese nombre en este tenant.');
    }
  }

  private async ensureModulesExist(
    tx: Prisma.TransactionClient,
    moduleCodes: string[],
  ): Promise<void> {
    if (moduleCodes.length === 0) {
      return;
    }

    const existingModules = await tx.app_modules.findMany({
      where: {
        module_code: { in: moduleCodes },
      },
      select: { module_code: true },
    });

    const existingCodes = new Set(existingModules.map((module) => module.module_code));
    const missingCodes = moduleCodes.filter((moduleCode) => !existingCodes.has(moduleCode));

    if (missingCodes.length > 0) {
      throw new BadRequestException(
        `Los siguientes moduleCode no existen: ${missingCodes.join(', ')}.`,
      );
    }
  }

  private ensureUniqueModuleCodes(modules: TenantProfileModuleConfigDto[]): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const module of modules) {
      if (seen.has(module.moduleCode)) {
        duplicates.add(module.moduleCode);
      }
      seen.add(module.moduleCode);
    }

    if (duplicates.size > 0) {
      throw new BadRequestException(
        `No se permiten moduleCode duplicados: ${Array.from(duplicates).join(', ')}.`,
      );
    }
  }

  private ensureAccessLevelsAreValid(modules: TenantProfileModuleConfigDto[]): void {
    const allowed = new Set<string>(ACCESS_LEVELS);
    const invalid = modules
      .filter((module) => !allowed.has(module.accessLevel))
      .map((module) => module.accessLevel);

    if (invalid.length > 0) {
      throw new BadRequestException(
        `accessLevel invalido: ${Array.from(new Set(invalid)).join(', ')}.`,
      );
    }
  }

  private normalizeModules(
    modules: TenantProfileModuleConfigDto[],
  ): NormalizedModuleConfig[] {
    const normalized = modules.map((module) => ({
      moduleCode: this.normalizeRequiredText(module.moduleCode, 'moduleCode'),
      accessLevel: module.accessLevel,
    }));

    this.ensureUniqueModuleCodes(normalized);
    this.ensureAccessLevelsAreValid(normalized);

    return normalized;
  }

  private normalizeSearch(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();
    return normalized || undefined;
  }

  private normalizeRequiredText(value: string, field: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} es obligatorio.`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} no puede estar vacio.`);
    }

    return normalized;
  }

  private normalizeOptionalText(
    value: string | null | undefined,
    field: string,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return this.normalizeRequiredText(value, field);
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un perfil con ese nombre en este tenant.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('La relacion referencial del perfil es invalida.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el registro solicitado.');
      }
    }
  }

  private toProfileResponse(
    profile: TenantProfileRecord,
    countModules: { access_level: string }[] = profile.tenant_profile_modules ?? [],
    modules?: TenantProfileModuleRecord[],
  ): TenantProfileResponseDto {
    return {
      idTenant: Number(profile.id_tenant),
      idProfile: Number(profile.id_profile),
      nombre: profile.nombre,
      descripcion: profile.descripcion,
      activo: profile.activo,
      createdAt: null,
      updatedAt: null,
      totalModules: countModules.length,
      totalAccess: countModules.filter((module) => module.access_level === 'ACCESO_TOTAL').length,
      totalReadOnly: countModules.filter((module) => module.access_level === 'SOLO_LECTURA')
        .length,
      totalNoAccess: countModules.filter((module) => module.access_level === 'SIN_ACCESO')
        .length,
      modules: modules?.map((module) => this.toModuleResponse(module)),
    };
  }

  private toModuleResponse(
    module: TenantProfileModuleRecord,
  ): TenantProfileModuleResponseDto {
    return {
      idTenant: Number(module.id_tenant),
      idProfile: Number(module.id_profile),
      moduleCode: module.module_code,
      nombre: module.app_modules.nombre,
      grupo: module.app_modules.grupo,
      orden: module.app_modules.orden,
      activo: module.app_modules.activo,
      accessLevel: module.access_level,
    };
  }
}
