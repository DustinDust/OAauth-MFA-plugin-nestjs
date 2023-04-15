import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GithubGuard } from './guards/github.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private configService: ConfigService,
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
    const jwt = await this.jwtService.signAsync(
      {
        accessToken: req.user.accessToken,
        provider: req.user.profile.provider,
        userId: req.user.profile.id,
      },
      {
        secret: this.jwtSecret,
      },
    );
    res.cookie('jwt', jwt);
    res.redirect('/');
  }

  @Get('github/login')
  @UseGuards(GithubGuard)
  async loginWithGithub(@Res() res) {
    res.redirect('/');
  }

  @Get('github/callback')
  @UseGuards(GithubGuard)
  async githubCallback(@Res({ passthrough: true }) res: Response, @Req() req) {
    const jwt = await this.jwtService.signAsync(
      {
        accessToken: req.user.accessToken,
        provider: req.user.profile.provider,
        userId: req.user.profile.id,
      },
      {
        secret: this.jwtSecret,
      },
    );
    res.cookie('jwt', jwt);
    res.redirect('/');
  }

  @Get('test')
  @UseGuards(JwtGuard)
  async testJwtGuard(@Req() req) {
    return await this.authService.getUserInfo(
      req.user.accessToken,
      req.user.provider,
    );
  }
}
