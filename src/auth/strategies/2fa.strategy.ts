import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/auth/services/user.service';
import { AuthModuleOptions } from '../auth-dynamic.module';
import { UnauthorizedRedirectException } from '../errors/unauthorized-redirect.exception';
import { fromCookies } from '../helpers';
import { getConfigToken, JWT_SECRET } from '../helpers/constants';
import { IClsStore } from '../interfaces/cls-store.interface';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';

@Injectable()
export class TwoFactorAuthStrategy extends PassportStrategy(Strategy, '2fa') {
  option: AuthModuleOptions;
  constructor(
    private readonly userService: UserService,
    private readonly clsService: ClsService,
    configService: ConfigService,
    options: AuthModuleOptions,
  ) {
    super({
      secretOrKey: configService.get(
        getConfigToken(options.env.prefix, JWT_SECRET),
      ),
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
      passReqToCallback: true,
    });
    this.option = options;
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
            typeof this.option.routes.redirect.otpAuthenticate === 'string'
              ? this.option.routes.redirect.otpAuthenticate
              : this.option.routes.redirect.otpAuthenticate(user),
            '2FA required',
          );
        } else {
          throw new UnauthorizedRedirectException(
            user,
            typeof this.option.routes.redirect.otpSetup === 'string'
              ? this.option.routes.redirect.otpSetup
              : this.option.routes.redirect.otpSetup(user),
            '2FA setup required',
          );
        }
      } else {
        if (user.authenticators && user.authenticators.length > 0) {
          throw new UnauthorizedRedirectException(
            user,
            typeof this.option.routes.redirect.webAuthnAuthenticate === 'string'
              ? this.option.routes.redirect.webAuthnAuthenticate
              : this.option.routes.redirect.webAuthnAuthenticate(user),
            'Webauthn required',
          );
        } else {
          throw new UnauthorizedRedirectException(
            user,
            typeof this.option.routes.redirect.webAuthnRegister === 'string'
              ? this.option.routes.redirect.webAuthnRegister
              : this.option.routes.redirect.webAuthnRegister(user),
            'Webauthn regsitration required',
          );
        }
      }
    }
    return;
  }
}
