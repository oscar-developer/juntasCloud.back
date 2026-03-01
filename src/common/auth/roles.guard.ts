import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const membershipRole = (request as Request & { membershipRole?: string }).membershipRole;

    if (!membershipRole) {
      throw new ForbiddenException('No existe contexto de membresia para validar roles.');
    }

    if (!requiredRoles.includes(membershipRole)) {
      throw new ForbiddenException('No tiene permisos suficientes para esta operacion.');
    }

    return true;
  }
}
