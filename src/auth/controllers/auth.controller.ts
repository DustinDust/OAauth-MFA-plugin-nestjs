import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Response } from 'express';
import { GithubGuard } from '../guards/github.guard';
import { GoogleGuard } from '../guards/google.guard';
import { JwtGuard } from '../guards/jwt.guard';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { UserService } from 'src/auth/services/user.service';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';
import { ClsService } from 'nestjs-cls';
import { UserDocument } from 'src/auth/schemas/user.schema';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { IClsStore } from '../interfaces/cls-store.interface';
import { UnauthorizedRedirectExceptionFilter } from '../filters/UnauthorizedRedirect.filter';
import { AuthService } from '../services/auth.service';

@Controller('auth')
@UsePipes(ZodValidationPipe)
@UseFilters(new UnauthorizedRedirectExceptionFilter())
export class AuthController {
  constructor(
    private userService: UserService,
    private clsService: ClsService,
    private authService: AuthService,
  ) {}

  get clsConfig() {
    return this.clsService.get<IClsStore>();
  }

  get moduleOptions() {
    return this.authService.authModuleOptions;
  }

  @Get('google/login')
  @UseGuards(GoogleGuard)
  async loginWithGoogle(@Res() res) {
    res.redirect('/');
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Req() req,
  ) {
    const user = req.user.user as UserDocument;
    const jwt = await this.authService.generateJwtToken({
      id: user._id,
      is2FAuthenticated: false,
    });
    res.cookie('jwt', jwt);
    const currentConfig = this.clsService.get<IClsStore>();
    if (currentConfig.mfaEnforce) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          if (typeof this.authService.otpAuthenticateRedirect === 'string') {
            res.redirect(this.authService.otpAuthenticateRedirect);
          } else {
            res.redirect(this.authService.otpAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.otpSetupRedirect === 'string') {
            res.redirect(this.authService.otpSetupRedirect);
          } else {
            res.redirect(this.authService.otpSetupRedirect(user));
          }
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          if (
            typeof this.authService.webauthnAuthenticateRedirect === 'string'
          ) {
            res.redirect(this.authService.webauthnAuthenticateRedirect);
          } else {
            res.redirect(this.authService.webauthnAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.webauthnRegisterRedirect === 'string') {
            res.redirect(this.authService.webauthnRegisterRedirect);
          } else {
            res.redirect(this.authService.webauthnRegisterRedirect(user));
          }
        }
      }
    } else if (user.isMfaEnabled) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          if (typeof this.authService.otpAuthenticateRedirect === 'string') {
            res.redirect(this.authService.otpAuthenticateRedirect);
          } else {
            res.redirect(this.authService.otpAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.otpSetupRedirect === 'string') {
            res.redirect(this.authService.otpSetupRedirect);
          } else {
            res.redirect(this.authService.otpSetupRedirect(user));
          }
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          if (
            typeof this.authService.webauthnAuthenticateRedirect === 'string'
          ) {
            res.redirect(this.authService.webauthnAuthenticateRedirect);
          } else {
            res.redirect(this.authService.webauthnAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.webauthnRegisterRedirect === 'string') {
            res.redirect(this.authService.webauthnRegisterRedirect);
          } else {
            res.redirect(this.authService.webauthnRegisterRedirect(user));
          }
        }
      }
    } else {
      if (
        typeof this.authService.successAuthenticatedWithProvider === 'string'
      ) {
        res.redirect(this.authService.successAuthenticatedWithProvider);
      } else {
        res.redirect(this.authService.successAuthenticatedWithProvider(user));
      }
    }
  }

  @Get('github/login')
  @UseGuards(GithubGuard)
  async loginWithGithub(@Res() res) {
    res.redirect('/');
  }

  @Get('github/callback')
  @UseGuards(GithubGuard)
  async githubCallback(@Res({ passthrough: true }) res: Response, @Req() req) {
    const user = req.user.user as UserDocument;
    const jwt = await this.authService.generateJwtToken({
      id: user._id,
      is2FAuthenticated: false,
    });
    res.cookie('jwt', jwt);
    const currentConfig = this.clsService.get<IClsStore>();
    if (currentConfig.mfaEnforce) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          if (typeof this.authService.otpAuthenticateRedirect === 'string') {
            res.redirect(this.authService.otpAuthenticateRedirect);
          } else {
            res.redirect(this.authService.otpAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.otpSetupRedirect === 'string') {
            res.redirect(this.authService.otpSetupRedirect);
          } else {
            res.redirect(this.authService.otpSetupRedirect(user));
          }
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          if (
            typeof this.authService.webauthnAuthenticateRedirect === 'string'
          ) {
            res.redirect(this.authService.webauthnAuthenticateRedirect);
          } else {
            res.redirect(this.authService.webauthnAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.webauthnRegisterRedirect === 'string') {
            res.redirect(this.authService.webauthnRegisterRedirect);
          } else {
            res.redirect(this.authService.webauthnRegisterRedirect(user));
          }
        }
      }
    } else if (user.isMfaEnabled) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          if (typeof this.authService.otpAuthenticateRedirect === 'string') {
            res.redirect(this.authService.otpAuthenticateRedirect);
          } else {
            res.redirect(this.authService.otpAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.otpSetupRedirect === 'string') {
            res.redirect(this.authService.otpSetupRedirect);
          } else {
            res.redirect(this.authService.otpSetupRedirect(user));
          }
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          if (
            typeof this.authService.webauthnAuthenticateRedirect === 'string'
          ) {
            res.redirect(this.authService.webauthnAuthenticateRedirect);
          } else {
            res.redirect(this.authService.webauthnAuthenticateRedirect(user));
          }
        } else {
          if (typeof this.authService.webauthnRegisterRedirect === 'string') {
            res.redirect(this.authService.webauthnRegisterRedirect);
          } else {
            res.redirect(this.authService.webauthnRegisterRedirect(user));
          }
        }
      }
    } else {
      if (
        typeof this.authService.successAuthenticatedWithProvider === 'string'
      ) {
        res.redirect(this.authService.successAuthenticatedWithProvider);
      } else {
        res.redirect(this.authService.successAuthenticatedWithProvider(user));
      }
    }
  }

  @Get('user-basic')
  @UseGuards(JwtGuard)
  async getBasicUserInfo(@Req() req) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    const user = await this.userService.getUserById(
      (req.user as IJWTClaims).id,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    delete user.otp;
    delete user.authenticators;
    delete user.providers;
    return user;
  }

  @Get('test')
  @UseGuards(JwtGuard, TwoFactorGuard)
  async testJwtGuard(@Req() req) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    const user = await this.userService.getUserById(
      (req.user as IJWTClaims).id,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    delete user.otp;
    delete user.authenticators;
    delete user.providers;
    return user;
  }
}
