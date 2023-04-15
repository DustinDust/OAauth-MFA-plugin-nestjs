import { ConfigService } from '@nestjs/config';
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
  constructor(configService: ConfigService) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
    });
  }

  async validate(payload) {
    return payload;
  }
}
