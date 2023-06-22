import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { UserService } from 'src/auth/services/user.service';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import {
  AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from '../auth-dynamic.module';
import { ConfigService } from '@nestjs/config';
import { getConfigToken, JWT_SECRET } from '../helpers/constants';

@Injectable()
export class TwoFactorAuthenticationService {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
    @Inject(MODULE_OPTIONS_TOKEN) private authModuleConfig: AuthModuleOptions,
  ) {}

  get jwtSecret() {
    return this.configService.get(
      getConfigToken(this.authModuleConfig.env.prefix, JWT_SECRET),
    );
  }

  async getSecret(userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.isMfaEnabled || !user.otp) {
      throw new ForbiddenException();
    }
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      this.jwtSecret,
      user.otp.secret,
    );
    return {
      secret: user.otp.secret,
      otpAuthUrl,
    };
  }

  async generateTwoFactorAuthenticationSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.userService.getUserById(userId);
    await this.userService.updateOtpInfo(userId, secret);
    const otpAuthUrl = authenticator.keyuri(user.email, this.jwtSecret, secret);

    return {
      secret,
      otpAuthUrl,
    };
  }

  async pipeQrCodeStream(stream: Response, otpAuthUrl: string) {
    return toFileStream(stream, otpAuthUrl, {
      type: 'png',
      width: 200,
      errorCorrectionLevel: 'H',
    });
  }

  async verify(userId: string, token: string) {
    const user = await this.userService.getUserById(userId);
    return authenticator.verify({
      token: token,
      secret: user.otp.secret,
    });
  }
}
