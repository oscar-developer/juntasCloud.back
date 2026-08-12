import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

type ErrorBody = {
  statusCode: number;
  message: string;
  error: string;
  details?: string;
};

type MappedError = {
  statusCode: number;
  message: string;
};

const STATUS_LABELS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = this.mapPrismaError(exception);
    const body: ErrorBody = {
      statusCode: mapped.statusCode,
      message: mapped.message,
      error:
        STATUS_LABELS[mapped.statusCode] ??
        STATUS_LABELS[HttpStatus.INTERNAL_SERVER_ERROR],
    };

    if (mapped.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(this.getLogMessage(exception), exception.stack);
      const details = this.getDevelopmentDetails(exception);

      if (details) {
        body.details = details;
      }
    }

    response.status(mapped.statusCode).json(body);
  }

  private mapPrismaError(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
  ): MappedError {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Ya existe un registro que viola una regla unica.',
        };
      }

      if (exception.code === 'P2003') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message:
            'No se puede completar la operacion porque existen relaciones asociadas.',
        };
      }

      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No se encontro el recurso solicitado.',
        };
      }

      if (exception.code === 'P2010') {
        const postgresMessage = this.getPostgresRaiseExceptionMessage(exception);
        if (postgresMessage) {
          return this.mapPostgresBusinessMessage(postgresMessage);
        }
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrio un error interno al procesar la solicitud.',
    };
  }

  private getPostgresRaiseExceptionMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta;
    const cause = this.getObjectValue(
      this.getObjectValue(meta, 'driverAdapterError'),
      'cause',
    );
    const originalCode = this.getStringValue(cause, 'originalCode');
    const code = this.getStringValue(cause, 'code');

    if (originalCode !== 'P0001' && code !== 'P0001') {
      return undefined;
    }

    return (
      this.getStringValue(cause, 'originalMessage') ??
      this.getStringValue(cause, 'message') ??
      exception.message
    );
  }

  private mapPostgresBusinessMessage(message: string): MappedError {
    const normalized = this.normalize(message);

    if (normalized.includes('usuario no autenticado')) {
      return { statusCode: HttpStatus.UNAUTHORIZED, message };
    }

    if (
      normalized.includes('owner') ||
      normalized.includes('admin') ||
      normalized.includes('permiso') ||
      normalized.includes('no pertenece')
    ) {
      return { statusCode: HttpStatus.FORBIDDEN, message };
    }

    if (
      normalized.includes('no existe') ||
      normalized.includes('no encontrado') ||
      normalized.includes('no encontrada')
    ) {
      return { statusCode: HttpStatus.NOT_FOUND, message };
    }

    if (
      normalized.includes('obligatorio') ||
      normalized.includes('token invalido') ||
      normalized.includes('confirmacion no es valida') ||
      normalized.includes('identificador') ||
      normalized.includes('confirmacion')
    ) {
      return { statusCode: HttpStatus.BAD_REQUEST, message };
    }

    if (
      normalized.includes('ya existe') ||
      normalized.includes('no disponible') ||
      normalized.includes('papelera') ||
      normalized.includes('estado') ||
      normalized.includes('no esta disponible')
    ) {
      return { statusCode: HttpStatus.CONFLICT, message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrio un error interno al procesar la solicitud.',
    };
  }

  private normalize(message: string): string {
    return message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private getObjectValue(source: unknown, key: string): Record<string, unknown> | undefined {
    if (!source || typeof source !== 'object') {
      return undefined;
    }

    const value = (source as Record<string, unknown>)[key];
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private getStringValue(
    source: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = source?.[key];
    return typeof value === 'string' ? value : undefined;
  }

  private getLogMessage(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
  ): string {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return `Prisma error no mapeado ${exception.code}: ${exception.message}`;
    }

    return `Prisma error desconocido: ${exception.message}`;
  }

  private getDevelopmentDetails(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
  ): string | undefined {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const cause = this.getObjectValue(
        this.getObjectValue(exception.meta, 'driverAdapterError'),
        'cause',
      );
      const databaseMessage =
        this.getStringValue(cause, 'originalMessage') ??
        this.getStringValue(cause, 'message');

      if (databaseMessage) {
        return this.sanitizeDevelopmentMessage(databaseMessage);
      }
    }

    return this.sanitizeDevelopmentMessage(exception.message);
  }

  private sanitizeDevelopmentMessage(message: string): string {
    return message.replace(/\s+/g, ' ').trim();
  }
}
