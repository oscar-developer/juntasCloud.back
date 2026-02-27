import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

type LoginMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, metadata: LoginMetadata): Promise<LoginResponseDto> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !password) {
      throw new BadRequestException('email y password son obligatorios.');
    }

    const user = await this.prisma.auth_users.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
        nombres: true,
        apellidos: true,
        email_verified: true,
        password_hash: true,
        estado: true,
      },
    });

    if (!user) {
      await this.insertLoginLog({
        idUser: null,
        email,
        success: false,
        failureReason: 'USER_NOT_FOUND',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const validPassword = await compare(password, user.password_hash);
    if (!validPassword) {
      await this.insertLoginLog({
        idUser: user.id_user,
        email: user.email,
        success: false,
        failureReason: 'INVALID_PASSWORD',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (user.estado !== 'ACTIVO') {
      await this.insertLoginLog({
        idUser: user.id_user,
        email: user.email,
        success: false,
        failureReason: 'USER_INACTIVE',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      throw new ForbiddenException('Usuario inactivo.');
    }

    const userIdNumber = this.bigintToSafeNumber(user.id_user, 'id_user');

    const accessToken = await this.jwtService.signAsync({
      sub: userIdNumber,
      user_id: userIdNumber,
      email: user.email,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.auth_users.update({
        where: { id_user: user.id_user },
        data: { last_login_at: new Date() },
      });

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO auth_login_logs (
            id_user,
            email,
            success,
            ip_address,
            user_agent,
            failure_reason
          )
          VALUES (
            ${user.id_user},
            ${user.email},
            ${true},
            ${metadata.ipAddress},
            ${metadata.userAgent},
            ${null}
          )
        `,
      );
    });

    return {
      accessToken,
      user: {
        id: userIdNumber,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        emailVerified: user.email_verified,
      },
    };
  }

  private async insertLoginLog(input: {
    idUser: bigint | null;
    email: string;
    success: boolean;
    failureReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO auth_login_logs (
          id_user,
          email,
          success,
          ip_address,
          user_agent,
          failure_reason
        )
        VALUES (
          ${input.idUser},
          ${input.email},
          ${input.success},
          ${input.ipAddress},
          ${input.userAgent},
          ${input.failureReason}
        )
      `,
    );
  }

  private bigintToSafeNumber(value: bigint, fieldName: string): number {
    const numberValue = Number(value);
    if (!Number.isSafeInteger(numberValue)) {
      throw new InternalServerErrorException(
        `${fieldName} excede el rango seguro para number en JavaScript.`,
      );
    }
    return numberValue;
  }
}
