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
import { Request, Response } from 'express';
import { Verify2FATokenDto } from '../dtos/verify-2fa-token.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { IJWTClaims } from '../interfaces/jwt-claims.interface';
import { TwoFactorAuthenticationService } from '../services/otp.service';

@Controller('2fa')
@UseInterceptors(ZodValidationPipe)
export class TwoFactorController {
  constructor(private readonly tfaService: TwoFactorAuthenticationService) {}

  @Get('qr')
  @UseGuards(JwtGuard)
  async getQr(@Req() req: Request, @Res() res: Response) {
    console.log(req.user);
    const { otpAuthUrl } = await this.tfaService.getSecret(
      (req.user as IJWTClaims).id,
    );
    return this.tfaService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @Post('generate')
  @UseGuards(JwtGuard)
  async setup2fa(@Res() res: Response, @Req() req: Request) {
    console.log(req.user);
    const { otpAuthUrl } =
      await this.tfaService.generateTwoFactorAuthenticationSecret(
        (req.user as IJWTClaims).id,
      );
    return this.tfaService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @Post('verify')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async verify(@Req() req: Request, @Body() body: Verify2FATokenDto) {
    const isValid = this.tfaService.verify(
      (req.user as IJWTClaims).id,
      body.token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    return await this.tfaService.enableOtpForUser((req.user as IJWTClaims).id);
  }
}
