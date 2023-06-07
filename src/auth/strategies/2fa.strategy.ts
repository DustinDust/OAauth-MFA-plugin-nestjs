import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/auth/services/user.service';
import { UnauthorizedRedirectException } from '../errors/unauthorized-redirect.exception';
import { fromCookies } from '../helpers';
import { IClsStore } from '../interfaces/cls-store.interface';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';

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
    const currentConfig = this.clsService.get<IClsStore>();
    if (user.isMfaEnabled || currentConfig.mfaEnforce) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          throw new UnauthorizedRedirectException(
            user,
            `/otp/authenticate/${user._id}`,
            '2FA required',
          );
        } else {
          throw new UnauthorizedRedirectException(
            user,
            `/otp/setup/${user._id}`,
            '2FA setup required',
          );
        }
      } else {
        if (user.authenticators && user.authenticators.length > 0) {
          throw new UnauthorizedRedirectException(
            user,
            `/webauthn/authenticate/${user._id}`,
            'Webauthn required',
          );
        } else {
          throw new UnauthorizedRedirectException(
            user,
            `/webauthn/register/${user._id}`,
            'Webauthn regsitration required',
          );
        }
      }
    }
    return;
  }
}
