import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PersonaConstanciaVerificacionDto } from './dto/persona-constancia-response.dto';
import { PersonaConstanciasService } from './persona-constancias.service';

@ApiTags('persona-constancias')
@Controller('persona-constancias')
export class PersonaConstanciasPublicController {
  constructor(
    private readonly personaConstanciasService: PersonaConstanciasService,
  ) {}

  @Get('verificar/:token')
  @ApiOperation({ summary: 'Verificar publicamente una constancia de persona' })
  @ApiParam({
    name: 'token',
    description: 'Token publico incluido en el codigo QR',
  })
  @ApiOkResponse({ type: PersonaConstanciaVerificacionDto })
  @ApiNotFoundResponse({
    description: 'La constancia no existe o el token es invalido.',
  })
  verify(
    @Param('token') token: string,
  ): Promise<PersonaConstanciaVerificacionDto> {
    return this.personaConstanciasService.verify(token);
  }
}
