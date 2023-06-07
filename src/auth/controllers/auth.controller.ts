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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
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

@Controller('auth')
@UsePipes(ZodValidationPipe)
@UseFilters(new UnauthorizedRedirectExceptionFilter())
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private configService: ConfigService,
    private userService: UserService,
    private clsService: ClsService,
  ) {}

  get jwtSecret() {
    return this.configService.get('JWT_SECRET');
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
    const jwt = await this.jwtService.signAsync(
      {
        id: user._id,
        is2FAuthenticated: false,
      },
      {
        secret: this.jwtSecret,
      },
    );
    res.cookie('jwt', jwt);
    const currentConfig = this.clsService.get<IClsStore>();
    if (currentConfig.mfaEnforce) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          res.redirect(`/otp/authenticate/${user._id}`);
        } else {
          res.redirect(`/otp/setup/${user._id}`);
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          res.redirect(`/webauthn/authenticate/${user._id}`);
        } else {
          res.redirect(`/webauthn/register/${user._id}`);
        }
      }
    } else if (user.isMfaEnabled) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          res.redirect(`/otp/authenticate/${user._id}`);
        } else {
          res.redirect(`/otp/setup/${user._id}`);
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          res.redirect(`/webauthn/authenticate/${user._id}`);
        } else {
          res.redirect(`/webauthn/register/${user._id}`);
        }
      }
    } else {
      res.redirect('/');
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
    const jwt = await this.jwtService.signAsync(
      {
        id: user._id,
        is2FAuthenticated: false,
      },
      {
        secret: this.jwtSecret,
      },
    );
    res.cookie('jwt', jwt);
    const currentConfig = this.clsService.get<IClsStore>();
    if (currentConfig.mfaEnforce) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          res.redirect(`/otp/authenticate/${user._id}`);
        } else {
          res.redirect(`/otp/setup/${user._id}`);
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          res.redirect(`/webauthn/authenticate/${user._id}`);
        } else {
          res.redirect(`/webauthn/register/${user._id}`);
        }
      }
    } else if (user.isMfaEnabled) {
      if (currentConfig.mfaType === 'otp') {
        if (user.otp) {
          res.redirect(`/otp/authenticate/${user._id}`);
        } else {
          res.redirect(`/otp/setup/${user._id}`);
        }
      } else if (currentConfig.mfaType === 'webauthn') {
        if (user.authenticators && user.authenticators.length > 0) {
          res.redirect(`/webauthn/authenticate/${user._id}`);
        } else {
          res.redirect(`/webauthn/register/${user._id}`);
        }
      }
    } else {
      res.redirect('/');
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
