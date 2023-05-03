import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
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
import { UserService } from 'src/user/user.service';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';
import { ClsService } from 'nestjs-cls';
import { UserDocument } from 'src/user/schemas/user.schema';
import { TwoFactorGuard } from '../guards/two-factor.guard';

@Controller('auth')
@UsePipes(ZodValidationPipe)
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
    if (this.clsService.get('mfaEnforce')) {
      if (user.isOtpEnabled && user.otp) {
        res.redirect(`/2fa/authenticate/${user._id}`);
      } else if (!(user.otp && user.isOtpEnabled)) {
        res.redirect(`/2fa/setup/${user._id}`);
      }
    } else {
      if (user.isOtpEnabled) {
        if (user.otp) {
          res.redirect(`/2fa/authenticate/${user._id}`);
        } else {
          res.redirect(`/2fa/setup/${user._id}`);
        }
      } else {
        res.redirect('/');
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
    if (this.clsService.get('mfaEnforce')) {
      if (user.otp) {
        res.redirect(`/2fa/authenticate/${user._id}`);
      } else {
        res.redirect(`/2fa/setup/${user._id}`);
      }
    } else {
      if (user.isOtpEnabled) {
        if (user.otp) {
          res.redirect(`/2fa/authenticate/${user._id}`);
        } else {
          res.redirect(`/2fa/setup/${user._id}`);
        }
      } else {
        res.redirect('/');
      }
    }
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
    return user;
  }
}
