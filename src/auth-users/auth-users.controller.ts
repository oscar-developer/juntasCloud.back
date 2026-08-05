import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserIdFromRequest } from '../common/auth/get-user-id-from-request';
import { AuthUsersService } from './auth-users.service';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { UpdateAuthUserDto } from './dto/update-auth-user.dto';

@ApiTags('auth-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth-users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuthUsersController {
  constructor(private readonly authUsersService: AuthUsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  findMe(@Req() req: Request): Promise<AuthUserResponseDto> {
    return this.authUsersService.findMe(getUserIdFromRequest(req));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar nombres y apellidos del usuario autenticado' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  updateMe(
    @Body() dto: UpdateAuthUserDto,
    @Req() req: Request,
  ): Promise<AuthUserResponseDto> {
    return this.authUsersService.updateMe(getUserIdFromRequest(req), dto);
  }
}
