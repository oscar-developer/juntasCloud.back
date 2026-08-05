import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub?: number | string;
  user_id?: number | string;
  email?: string;
};

export type AuthenticatedUser = {
  userId: number;
  email?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Falta JWT_SECRET en variables de entorno.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const rawUserId = payload.user_id ?? payload.sub;
    const userId = Number(rawUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
    }

    const user = await this.prisma.auth_users.findUnique({
      where: { id_user: BigInt(userId) },
      select: {
        email: true,
        estado: true,
        email_verified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token invalido: usuario no encontrado.');
    }

    if (user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Token invalido: usuario no activo.');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Token invalido: correo no verificado.');
    }

    return {
      userId,
      email: user.email,
    };
  }
}
