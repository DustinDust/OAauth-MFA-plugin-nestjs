import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { fromCookies } from '../helpers';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(secret: string) {
    super({
      secretOrKey: secret,
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
    });
  }

  async validate(payload: IJWTClaims) {
    console.log(payload);
    return payload;
  }
}
