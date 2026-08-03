import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export function getUserIdFromRequest(req: Request): bigint {
  const user = req.user as { userId?: number } | undefined;

  if (!user?.userId || !Number.isInteger(user.userId) || user.userId <= 0) {
    throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
  }

  return BigInt(user.userId);
}
