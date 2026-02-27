import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
  constructor() {
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

  validate(payload: JwtPayload): AuthenticatedUser {
    const rawUserId = payload.user_id ?? payload.sub;
    const userId = Number(rawUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Token invalido: user_id ausente o invalido.');
    }

    return {
      userId,
      email: payload.email,
    };
  }
}
