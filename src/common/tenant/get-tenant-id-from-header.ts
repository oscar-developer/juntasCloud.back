import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export function getTenantIdFromHeader(req: Request): bigint {
  const rawHeader = req.headers['x-tenant-id'];
  const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!value) {
    throw new BadRequestException('El header X-Tenant-Id es obligatorio.');
  }

  if (!/^\d+$/.test(value)) {
    throw new BadRequestException('El header X-Tenant-Id debe ser un entero positivo.');
  }

  return BigInt(value);
}
