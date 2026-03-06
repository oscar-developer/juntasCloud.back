import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthMessageResponseDto } from './dto/auth-message-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nueva cuenta' })
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthMessageResponseDto> {
    return this.authService.register(dto, this.extractRequestMetadata(req));
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener JWT' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @ApiForbiddenResponse({
    description: 'Usuario inactivo o email no verificado',
  })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    return this.authService.login(dto, this.extractRequestMetadata(req));
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Token invalido, expirado o ya utilizado',
  })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthMessageResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Reenviar correo de verificacion' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() req: Request,
  ): Promise<AuthMessageResponseDto> {
    return this.authService.resendVerification(
      dto,
      this.extractRequestMetadata(req),
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperacion de contrasena' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<AuthMessageResponseDto> {
    return this.authService.forgotPassword(
      dto,
      this.extractRequestMetadata(req),
    );
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Actualizar contrasena con token de recuperacion' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Token invalido, expirado o ya utilizado; o password invalido',
  })
  resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<AuthMessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  private extractRequestMetadata(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
  } {
    const forwardedFor = req.headers['x-forwarded-for'];
    const firstForwarded =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : null;
    const ipAddress = firstForwarded || req.ip || null;
    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : null;

    return { ipAddress, userAgent };
  }
}
