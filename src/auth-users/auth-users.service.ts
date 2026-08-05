import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { UpdateAuthUserDto } from './dto/update-auth-user.dto';

@Injectable()
export class AuthUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: bigint): Promise<AuthUserResponseDto> {
    const user = await this.prisma.auth_users.findUnique({
      where: { id_user: userId },
    });

    if (!user) {
      throw new NotFoundException('No se encontro el usuario autenticado.');
    }

    return this.toResponse(user);
  }

  async updateMe(
    userId: bigint,
    dto: UpdateAuthUserDto,
  ): Promise<AuthUserResponseDto> {
    const nombres = this.normalizeOptionalText(dto.nombres, 'nombres');
    const apellidos = this.normalizeOptionalText(dto.apellidos, 'apellidos');

    if (nombres === undefined && apellidos === undefined) {
      throw new BadRequestException(
        'Debe enviar al menos nombres o apellidos para actualizar.',
      );
    }

    try {
      const user = await this.prisma.auth_users.update({
        where: { id_user: userId },
        data: {
          nombres,
          apellidos,
        },
      });

      return this.toResponse(user);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  private normalizeOptionalText(
    value: string | undefined,
    field: string,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} debe ser texto.`);
    }
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} no puede estar vacio.`);
    }
    return normalized;
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el usuario autenticado.');
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
    email_verified_at: Date | null;
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
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
    };
  }
}
