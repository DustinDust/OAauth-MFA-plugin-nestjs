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

@Controller('auth')
@UsePipes(ZodValidationPipe)
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private configService: ConfigService,
    private userService: UserService,
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
        id: req.user.userId,
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
        id: req.user.userId,
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
    const user = await this.userService.getUserById(
      (req.user as IJWTClaims).id,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
