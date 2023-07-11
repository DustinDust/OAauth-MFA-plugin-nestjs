import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { UserDocument } from 'src/auth/schemas/user.schema';
import { Verify2FATokenDto } from '../dtos/verify-2fa-token.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';
import { AuthService } from '../services/auth.service';
import { TwoFactorAuthenticationService } from '../services/otp.service';

@Controller('2fa')
@UseInterceptors(ZodValidationPipe)
export class TwoFactorController {
  constructor(
    private readonly tfaService: TwoFactorAuthenticationService,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Post('turn-off')
  @UseGuards(JwtGuard, TwoFactorGuard)
  async turnOff(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    const user = req.user as UserDocument;
    if (!user) {
      throw new UnauthorizedException();
    }
    this.authService.disable2FAForUser(user._id.toString());
    return { success: true, message: 'ok' };
  }

  @Get('qr')
  @UseGuards(JwtGuard)
  async getQr(@Req() req: Request, @Res() res: Response) {
    const { otpAuthUrl } = await this.tfaService.getSecret(
      (req.user as IJWTClaims).id,
    );
    return this.tfaService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @Get('generate')
  @UseGuards(JwtGuard)
  async setup2fa(@Res() res: Response, @Req() req: Request) {
    const { otpAuthUrl } =
      await this.tfaService.generateTwoFactorAuthenticationSecret(
        (req.user as IJWTClaims).id,
      );
    return this.tfaService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @Post('turn-on')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async verify(
    @Req() req: Request,
    @Body() body: Verify2FATokenDto,
    @Res() res: Response,
  ) {
    const isValid = await this.tfaService.verify(
      (req.user as IJWTClaims).id,
      body.token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.authService.enable2FAForUser((req.user as IJWTClaims).id);
    const accessTokenCookie = await this.jwtService.signAsync(
      {
        id: (req.user as IJWTClaims).id,
        is2FAuthenticated: true,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
      },
    );
    res.cookie('jwt', accessTokenCookie);
    res.send({
      user: req.user,
    });
  }

  @Post('authenticate')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Req() req: Request,
    @Body() body: Verify2FATokenDto,
    @Res() res: Response,
  ) {
    const isValid = await this.tfaService.verify(
      (req.user as IJWTClaims).id,
      body.token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    const accessTokenCookie = await this.jwtService.signAsync(
      {
        id: (req.user as IJWTClaims).id,
        is2FAuthenticated: true,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
      },
    );
    res.cookie('jwt', accessTokenCookie);
    res.send({
      user: req.user,
    });
  }
}
