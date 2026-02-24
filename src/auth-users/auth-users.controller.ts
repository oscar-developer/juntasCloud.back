import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUsersService } from './auth-users.service';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { UpdateAuthUserDto } from './dto/update-auth-user.dto';
import { QueryAuthUsersDto } from './dto/query-auth-users.dto';

@ApiTags('auth-users')
@Controller('auth-users')
export class AuthUsersController {
  constructor(private readonly authUsersService: AuthUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario de autenticacion' })
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  create(@Body() dto: CreateAuthUserDto): Promise<AuthUserResponseDto> {
    return this.authUsersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios de autenticacion' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: ['ACTIVO', 'INACTIVO'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: AuthUserResponseDto, isArray: true })
  findAll(
    @Query('email') email?: string,
    @Query('estado') estado?: 'ACTIVO' | 'INACTIVO',
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ): Promise<AuthUserResponseDto[]> {
    const query: QueryAuthUsersDto = { email, estado, skip, take };
    return this.authUsersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por id_user' })
  @ApiParam({ name: 'id', description: 'id_user de auth_users' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  findOne(@Param('id') id: string): Promise<AuthUserResponseDto> {
    return this.authUsersService.findOne(this.authUsersService.parseId(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario por id_user' })
  @ApiParam({ name: 'id', description: 'id_user de auth_users' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAuthUserDto,
  ): Promise<AuthUserResponseDto> {
    return this.authUsersService.update(this.authUsersService.parseId(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario por id_user' })
  @ApiParam({ name: 'id', description: 'id_user de auth_users' })
  @ApiNoContentResponse({ description: 'Usuario eliminado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.authUsersService.remove(this.authUsersService.parseId(id));
  }
}
