import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import {
  AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from '../auth-dynamic.module';
import { getConfigToken, JWT_SECRET } from '../helpers/constants';
import { User } from '../schemas/user.schema';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  GITHUB_USER_ENDPOINT = 'https://api.github.com/user';
  GOOGLE_USER_ENDPOINT = 'https://www.googleapis.com/oauth2/v1/userinfo';
  constructor(
    private userService: UserService,
    @Inject(MODULE_OPTIONS_TOKEN) private options: AuthModuleOptions,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  get authModuleOptions() {
    return this.options;
  }

  get otpAuthenticateRedirect() {
    return this.options.routes.redirect.otpAuthenticate;
  }

  get otpSetupRedirect() {
    return this.options.routes.redirect.otpSetup;
  }

  get webauthnRegisterRedirect() {
    return this.options.routes.redirect.webAuthnRegister;
  }

  get webauthnAuthenticateRedirect() {
    return this.options.routes.redirect.webAuthnAuthenticate;
  }

  get successAuthenticatedWithProvider() {
    return this.options.routes.redirect.successAuthenticatedWithProvider;
  }

  async getUserInfo(accessToken: string, provider: 'google' | 'github') {
    if (provider === 'github') {
      const res = await axios.get(this.GITHUB_USER_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      return {
        displayName: res.data.displayName,
        id: res.data.id,
        photo: res.data.avatar_url,
        email: res.data.email,
        provider: provider,
      };
    }
    if (provider === 'google') {
      const res = await axios.get(this.GOOGLE_USER_ENDPOINT, {
        params: {
          access_token: accessToken,
          alt: 'json',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return {
        displayName: res.data.name,
        id: res.data.id,
        photo: res.data.picture,
        email: res.data.email,
        provider: provider,
      };
    }
  }
  async disable2FAForUser(id: string) {
    return await this.userService.disableOtp(id);
  }
  async enable2FAForUser(id: string) {
    return await this.userService.enableMfa(id);
  }
  async generateJwtToken(data: any) {
    return await this.jwt.signAsync(data, {
      secret: this.config.get(
        getConfigToken(this.options.env.prefix, JWT_SECRET),
      ),
    });
  }
}
