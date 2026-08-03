import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthMessageResponseDto } from './dto/auth-message-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type LoginMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class AuthService {
  private static readonly VERIFY_EMAIL_TOKEN_TYPE = 'VERIFY_EMAIL';
  private static readonly VERIFY_EMAIL_TOKEN_TTL_HOURS = 24;
  private static readonly RESET_PASSWORD_TOKEN_TYPE = 'RESET_PASSWORD';
  private static readonly RESET_PASSWORD_TOKEN_TTL_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(
    dto: LoginDto,
    metadata: LoginMetadata,
  ): Promise<LoginResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const password = this.normalizePassword(dto.password);

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

    if (!user.email_verified) {
      await this.insertLoginLog({
        idUser: user.id_user,
        email: user.email,
        success: false,
        failureReason: 'EMAIL_NOT_VERIFIED',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      throw new ForbiddenException(
        'Debes verificar tu correo antes de iniciar sesion.',
      );
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

  async register(
    dto: RegisterDto,
    metadata: LoginMetadata,
  ): Promise<AuthMessageResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const password = this.normalizePassword(dto.password);
    const nombres = this.normalizeRequiredText(dto.nombres, 'nombres');
    const apellidos = this.normalizeRequiredText(dto.apellidos, 'apellidos');

    const existingUser = await this.prisma.auth_users.findUnique({
      where: { email },
      select: { id_user: true },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email.');
    }

    const passwordHash = await hash(password, 10);
    const now = new Date();
    const expiresAt = this.buildTokenExpiration(
      now,
      AuthService.VERIFY_EMAIL_TOKEN_TTL_HOURS,
    );
    const plainToken = this.generatePlainToken();
    const tokenHash = this.hashToken(plainToken);

    try {
      await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.auth_users.create({
          data: {
            email,
            nombres,
            apellidos,
            password_hash: passwordHash,
            estado: 'ACTIVO',
            email_verified: false,
            email_verified_at: null,
          },
          select: { id_user: true, email: true },
        });

        await tx.auth_user_tokens.updateMany({
          where: {
            id_user: createdUser.id_user,
            token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
            used_at: null,
            revoked_at: null,
            expires_at: { gt: now },
          },
          data: { revoked_at: now },
        });

        await tx.auth_user_tokens.create({
          data: {
            id_user: createdUser.id_user,
            token_hash: tokenHash,
            token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
            expires_at: expiresAt,
            created_ip: metadata.ipAddress,
            user_agent: metadata.userAgent,
          },
        });
      });
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }

    await this.mailService.sendEmailVerification({
      email,
      token: plainToken,
      expiresInHours: AuthService.VERIFY_EMAIL_TOKEN_TTL_HOURS,
    });

    return {
      message: 'Te enviamos un correo para verificar tu cuenta.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthMessageResponseDto> {
    const token = this.normalizeToken(dto.token);
    const tokenHash = this.hashToken(token);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.auth_user_tokens.findFirst({
        where: {
          token_hash: tokenHash,
          token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
          revoked_at: null,
        },
        select: {
          id_token: true,
          id_user: true,
          expires_at: true,
          used_at: true,
        },
      });

      if (
        !storedToken ||
        storedToken.used_at ||
        storedToken.expires_at.getTime() <= now.getTime()
      ) {
        throw new BadRequestException(
          'Token invalido, expirado o ya utilizado.',
        );
      }

      const tokenUpdateResult = await tx.auth_user_tokens.updateMany({
        where: {
          id_token: storedToken.id_token,
          used_at: null,
        },
        data: { used_at: now },
      });

      if (tokenUpdateResult.count !== 1) {
        throw new BadRequestException(
          'Token invalido, expirado o ya utilizado.',
        );
      }

      await tx.auth_users.update({
        where: { id_user: storedToken.id_user },
        data: {
          email_verified: true,
          email_verified_at: now,
          updated_at: now,
        },
      });

      await tx.auth_user_tokens.updateMany({
        where: {
          id_user: storedToken.id_user,
          token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
          used_at: null,
          revoked_at: null,
        },
        data: { revoked_at: now },
      });
    });

    return {
      message: 'Correo verificado correctamente.',
    };
  }

  async resendVerification(
    dto: ResendVerificationDto,
    metadata: LoginMetadata,
  ): Promise<AuthMessageResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const genericResponse: AuthMessageResponseDto = {
      message: 'Si el correo existe, enviaremos instrucciones.',
    };

    const user = await this.prisma.auth_users.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
        email_verified: true,
      },
    });

    if (!user || user.email_verified) {
      return genericResponse;
    }

    const now = new Date();
    const expiresAt = this.buildTokenExpiration(
      now,
      AuthService.VERIFY_EMAIL_TOKEN_TTL_HOURS,
    );
    const plainToken = this.generatePlainToken();
    const tokenHash = this.hashToken(plainToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.auth_user_tokens.updateMany({
        where: {
          id_user: user.id_user,
          token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
          used_at: null,
          revoked_at: null,
          expires_at: { gt: now },
        },
        data: { revoked_at: now },
      });

      await tx.auth_user_tokens.create({
        data: {
          id_user: user.id_user,
          token_hash: tokenHash,
          token_type: AuthService.VERIFY_EMAIL_TOKEN_TYPE,
          expires_at: expiresAt,
          created_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
        },
      });
    });

    await this.mailService.sendEmailVerification({
      email: user.email,
      token: plainToken,
      expiresInHours: AuthService.VERIFY_EMAIL_TOKEN_TTL_HOURS,
    });

    return genericResponse;
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    metadata: LoginMetadata,
  ): Promise<AuthMessageResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const genericResponse: AuthMessageResponseDto = {
      message:
        'Si el correo existe, enviaremos instrucciones para recuperar tu contrasena.',
    };

    const user = await this.prisma.auth_users.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
      },
    });

    if (!user) {
      return genericResponse;
    }

    const now = new Date();
    const expiresAt = this.buildTokenExpiration(
      now,
      AuthService.RESET_PASSWORD_TOKEN_TTL_HOURS,
    );
    const plainToken = this.generatePlainToken();
    const tokenHash = this.hashToken(plainToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.auth_user_tokens.updateMany({
        where: {
          id_user: user.id_user,
          token_type: AuthService.RESET_PASSWORD_TOKEN_TYPE,
          used_at: null,
          revoked_at: null,
          expires_at: { gt: now },
        },
        data: { revoked_at: now },
      });

      await tx.auth_user_tokens.create({
        data: {
          id_user: user.id_user,
          token_hash: tokenHash,
          token_type: AuthService.RESET_PASSWORD_TOKEN_TYPE,
          expires_at: expiresAt,
          created_ip: metadata.ipAddress,
          user_agent: metadata.userAgent,
        },
      });
    });

    await this.mailService.sendPasswordReset({
      email: user.email,
      token: plainToken,
      expiresInHours: AuthService.RESET_PASSWORD_TOKEN_TTL_HOURS,
    });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<AuthMessageResponseDto> {
    const token = this.normalizeToken(dto.token);
    const newPassword = this.normalizePassword(dto.newPassword);
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const passwordHash = await hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.auth_user_tokens.findFirst({
        where: {
          token_hash: tokenHash,
          token_type: AuthService.RESET_PASSWORD_TOKEN_TYPE,
          revoked_at: null,
        },
        select: {
          id_token: true,
          id_user: true,
          expires_at: true,
          used_at: true,
        },
      });

      if (
        !storedToken ||
        storedToken.used_at ||
        storedToken.expires_at.getTime() <= now.getTime()
      ) {
        throw new BadRequestException(
          'Token invalido, expirado o ya utilizado.',
        );
      }

      const tokenUpdateResult = await tx.auth_user_tokens.updateMany({
        where: {
          id_token: storedToken.id_token,
          used_at: null,
        },
        data: { used_at: now },
      });

      if (tokenUpdateResult.count !== 1) {
        throw new BadRequestException(
          'Token invalido, expirado o ya utilizado.',
        );
      }

      await tx.auth_users.update({
        where: { id_user: storedToken.id_user },
        data: {
          password_hash: passwordHash,
          updated_at: now,
        },
      });

      await tx.auth_user_tokens.updateMany({
        where: {
          id_user: storedToken.id_user,
          token_type: AuthService.RESET_PASSWORD_TOKEN_TYPE,
          used_at: null,
          revoked_at: null,
        },
        data: { revoked_at: now },
      });
    });

    return {
      message: 'Contrasena actualizada correctamente.',
    };
  }

  async changePassword(
    userId: bigint,
    dto: ChangePasswordDto,
  ): Promise<AuthMessageResponseDto> {
    const currentPassword = this.normalizePassword(dto.currentPassword);
    const newPassword = this.normalizePassword(dto.newPassword);

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'La nueva contrasena debe ser diferente a la contrasena actual.',
      );
    }

    const user = await this.prisma.auth_users.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        password_hash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token invalido: usuario no encontrado.');
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password_hash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contrasena actual es incorrecta.');
    }

    const now = new Date();
    const newPasswordHash = await hash(newPassword, 10);

    await this.prisma.auth_users.update({
      where: { id_user: user.id_user },
      data: {
        password_hash: newPasswordHash,
        updated_at: now,
      },
    });

    return {
      message: 'Contrasena actualizada correctamente.',
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

  private normalizePassword(password: string): string {
    if (typeof password !== 'string') {
      throw new BadRequestException('password es obligatorio.');
    }

    const normalized = password.trim();
    if (!normalized) {
      throw new BadRequestException('password es obligatorio.');
    }

    return normalized;
  }

  private normalizeRequiredText(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
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

  private generatePlainToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildTokenExpiration(referenceDate: Date, ttlHours: number): Date {
    return new Date(referenceDate.getTime() + ttlHours * 60 * 60 * 1000);
  }

  private handleKnownErrors(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }
      if (error.code === 'P2025') {
        throw new BadRequestException('No se encontro el registro solicitado.');
      }
    }
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
