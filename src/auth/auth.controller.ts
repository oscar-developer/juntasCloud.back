import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener JWT' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @ApiForbiddenResponse({ description: 'Usuario inactivo' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const firstForwarded =
      typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : null;
    const ipAddress = firstForwarded || req.ip || null;
    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

    return this.authService.login(dto, {
      ipAddress,
      userAgent,
    });
  }
}
