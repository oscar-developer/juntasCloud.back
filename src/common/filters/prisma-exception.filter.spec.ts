import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let loggerErrorSpy: jest.SpyInstance;
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    filter = new PrismaExceptionFilter();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    process.env.NODE_ENV = nodeEnv;
  });

  function createHost() {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  }

  function knownError(
    code: string,
    message = 'Prisma error',
    meta?: Record<string, unknown>,
  ) {
    return new Prisma.PrismaClientKnownRequestError(message, {
      code,
      clientVersion: 'test',
      meta,
    });
  }

  function postgresRaiseException(message: string) {
    return knownError('P2010', 'Raw query failed', {
      driverAdapterError: {
        cause: {
          originalCode: 'P0001',
          originalMessage: message,
          code: 'P0001',
          message,
        },
      },
    });
  }

  function expectResponse(
    error: Prisma.PrismaClientKnownRequestError,
    statusCode: number,
    message: string,
  ) {
    const { host, response } = createHost();

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(statusCode);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode,
        message,
      }),
    );
  }

  it('traduce P2010/P0001 de papelera a 409', () => {
    const message =
      'El tenant debe estar en la papelera antes de eliminarse definitivamente';

    expectResponse(
      postgresRaiseException(message),
      HttpStatus.CONFLICT,
      message,
    );
  });

  it('traduce mensajes de permisos OWNER a 403', () => {
    const message = 'Solamente el OWNER puede eliminar definitivamente el tenant';

    expectResponse(
      postgresRaiseException(message),
      HttpStatus.FORBIDDEN,
      message,
    );
  });

  it('traduce mensajes no encontrado a 404', () => {
    const message = 'Invitacion no encontrada';

    expectResponse(
      postgresRaiseException(message),
      HttpStatus.NOT_FOUND,
      message,
    );
  });

  it('traduce mensajes obligatorios o confirmacion invalida a 400', () => {
    const message = 'La confirmacion no es valida';

    expectResponse(
      postgresRaiseException(message),
      HttpStatus.BAD_REQUEST,
      message,
    );
  });

  it('traduce P2002, P2003 y P2025 a status controlados', () => {
    expectResponse(
      knownError('P2002'),
      HttpStatus.CONFLICT,
      'Ya existe un registro que viola una regla unica.',
    );
    expectResponse(
      knownError('P2003'),
      HttpStatus.CONFLICT,
      'No se puede completar la operacion porque existen relaciones asociadas.',
    );
    expectResponse(
      knownError('P2025'),
      HttpStatus.NOT_FOUND,
      'No se encontro el recurso solicitado.',
    );
  });

  it('mantiene Prisma desconocido como 500 sin detalles tecnicos', () => {
    const { host, response } = createHost();

    filter.catch(knownError('P9999', 'Raw query failed: tabla interna'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrio un error interno al procesar la solicitud.',
      error: 'Internal Server Error',
      details: 'Raw query failed: tabla interna',
    });
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Prisma error no mapeado P9999'),
      expect.any(String),
    );
  });

  it('oculta details de Prisma desconocido en produccion', () => {
    process.env.NODE_ENV = 'production';
    const { host, response } = createHost();

    filter.catch(knownError('P9999', 'Raw query failed: tabla interna'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrio un error interno al procesar la solicitud.',
      error: 'Internal Server Error',
    });
  });
});
