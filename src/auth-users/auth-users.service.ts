import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { QueryAuthUsersDto } from './dto/query-auth-users.dto';
import { UpdateAuthUserDto } from './dto/update-auth-user.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';

@Injectable()
export class AuthUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuthUserDto): Promise<AuthUserResponseDto> {
    this.ensureEstadoIsValid(dto.estado);
    const nombres = this.normalizeRequiredText(dto.nombres, 'nombres');
    const apellidos = this.normalizeRequiredText(dto.apellidos, 'apellidos');
    const clave = this.normalizeClave(dto.clave);
    const passwordHash = await hash(clave, 10);

    try {
      const user = await this.prisma.auth_users.create({
        data: {
          email: dto.email,
          nombres,
          apellidos,
          password_hash: passwordHash,
          estado: dto.estado ?? 'ACTIVO',
          email_verified: false,
        },
      });

      return this.toResponse(user);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async findAll(query: QueryAuthUsersDto): Promise<AuthUserResponseDto[]> {
    this.ensureEstadoIsValid(query.estado);

    const take = this.normalizeTake(query.take);
    const skip = this.normalizeSkip(query.skip);

    const users = await this.prisma.auth_users.findMany({
      where: {
        email: query.email
          ? {
              contains: query.email,
              mode: 'insensitive',
            }
          : undefined,
        estado: query.estado,
      },
      orderBy: { id_user: 'desc' },
      skip,
      take,
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: bigint): Promise<AuthUserResponseDto> {
    const user = await this.prisma.auth_users.findUnique({
      where: { id_user: id },
    });

    if (!user) {
      throw new NotFoundException(`No existe auth_user con id ${id.toString()}`);
    }

    return this.toResponse(user);
  }

  async update(id: bigint, dto: UpdateAuthUserDto): Promise<AuthUserResponseDto> {
    this.ensureEstadoIsValid(dto.estado);

    const lastLoginAt = this.normalizeLastLoginAt(dto.lastLoginAt);
    const nombres = this.normalizeOptionalText(dto.nombres, 'nombres');
    const apellidos = this.normalizeOptionalText(dto.apellidos, 'apellidos');
    const passwordHash =
      dto.clave !== undefined ? await hash(this.normalizeClave(dto.clave), 10) : undefined;

    try {
      const user = await this.prisma.auth_users.update({
        where: { id_user: id },
        data: {
          email: dto.email,
          nombres,
          apellidos,
          password_hash: passwordHash,
          estado: dto.estado,
          updated_at: new Date(),
          last_login_at: lastLoginAt,
        },
      });

      return this.toResponse(user);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async remove(id: bigint): Promise<void> {
    try {
      await this.prisma.auth_users.delete({
        where: { id_user: id },
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('El id_user debe ser un numero entero positivo.');
    }

    return BigInt(id);
  }

  private normalizeTake(take?: number): number {
    if (take === undefined || take === null) {
      return 20;
    }
    if (!Number.isInteger(take) || take < 1 || take > 100) {
      throw new BadRequestException('take debe ser un entero entre 1 y 100.');
    }
    return take;
  }

  private normalizeSkip(skip?: number): number {
    if (skip === undefined || skip === null) {
      return 0;
    }
    if (!Number.isInteger(skip) || skip < 0) {
      throw new BadRequestException('skip debe ser un entero mayor o igual a 0.');
    }
    return skip;
  }

  private normalizeLastLoginAt(value?: string | null): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('lastLoginAt no tiene formato de fecha valido.');
    }
    return parsed;
  }

  private ensureEstadoIsValid(estado?: string): void {
    if (estado === undefined) {
      return;
    }
    if (estado !== 'ACTIVO' && estado !== 'INACTIVO') {
      throw new BadRequestException('estado solo admite ACTIVO o INACTIVO.');
    }
  }

  private normalizeClave(clave: string): string {
    if (typeof clave !== 'string') {
      throw new BadRequestException('clave es obligatoria.');
    }
    const normalized = clave.trim();
    if (!normalized) {
      throw new BadRequestException('clave no puede estar vacia.');
    }
    return normalized;
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

  private normalizeOptionalText(value: string | undefined, field: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.normalizeRequiredText(value, field);
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el usuario solicitado.');
      }
    }
  }

  private toResponse(user: {
    id_user: bigint;
    email: string;
    nombres: string;
    apellidos: string;
    estado: string;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
    last_login_at: Date | null;
  }): AuthUserResponseDto {
    return {
      idUser: Number(user.id_user),
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      estado: user.estado,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
    };
  }
}
