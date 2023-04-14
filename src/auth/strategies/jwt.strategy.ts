import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

function fromCookies(req: Request) {
  let token = undefined;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
}

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: 'JWTSecretKey',
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
    });
  }

  async validate(payload) {
    return payload;
  }
}
