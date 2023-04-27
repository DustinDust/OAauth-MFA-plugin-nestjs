import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { UserService } from 'src/user/user.service';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class TwoFactorAuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async getSecret(userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.isOtpEnabled || !user.otp) {
      throw new ForbiddenException();
    }
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      this.configService.get('TWO_FACTOR_AUTHENTICATOR_APP_NAME'),
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
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      this.configService.get('TWO_FACTOR_AUTHENTICATOR_APP_NAME'),
      secret,
    );

    return {
      secret,
      otpAuthUrl,
    };
  }

  async enableOtpForUser(id: string) {
    return await this.userService.enableOtp(id);
  }

  async pipeQrCodeStream(stream: Response, otpAuthUrl: string) {
    return toFileStream(stream, otpAuthUrl);
  }

  async verify(userId: string, token: string) {
    const user = await this.userService.getUserById(userId);
    return authenticator.verify({
      token: token,
      secret: user.otp.secret,
    });
  }
}
