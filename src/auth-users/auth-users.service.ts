import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    try {
      const user = await this.prisma.auth_users.create({
        data: {
          email: dto.email,
          password_hash: dto.passwordHash,
          estado: dto.estado ?? 'ACTIVO',
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

    try {
      const user = await this.prisma.auth_users.update({
        where: { id_user: id },
        data: {
          email: dto.email,
          password_hash: dto.passwordHash,
          estado: dto.estado,
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
    estado: string;
    created_at: Date;
    last_login_at: Date | null;
  }): AuthUserResponseDto {
    return {
      idUser: user.id_user.toString(),
      email: user.email,
      estado: user.estado,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  }
}
