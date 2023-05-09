import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';

function fromCookies(req: Request) {
  let token = undefined;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
}

@Injectable()
export class TwoFactorAuthStrategy extends PassportStrategy(Strategy, '2fa') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly clsService: ClsService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IJWTClaims) {
    const user = await this.userService.getUserById(payload.id);
    if (payload.is2FAuthenticated) {
      return user;
    }
    if (!user.isOtpEnabled) {
      if (this.clsService.get('mfaEnforce')) {
        req.res.redirect(`/2fa/setup/${user._id}`);
      } else return user;
    } else if (user.otp) {
      req.res.redirect(`/2fa/authenticate/${user._id}`);
    } else {
      req.res.redirect(`/2fa/setup/${user._id}`);
    }
    return;
  }
}
