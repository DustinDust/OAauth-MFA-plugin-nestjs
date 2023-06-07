import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
  generateRegistrationOptions,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  PublicKeyCredentialDescriptorFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import base64url from 'base64url';
import { Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';
import { ClsService } from 'nestjs-cls';
import { UserService } from 'src/auth/services/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { IWebauthnConfig } from '../interfaces/cls-store.interface';
import { type IJWTClaims } from '../interfaces/jwt-claims.interface';
import { Authenticator } from '../schemas/authenticator.schema';

@Controller('/webauthn')
export class WebAuthnController {
  config: IWebauthnConfig;
  constructor(
    private redisService: RedisService,
    private userService: UserService,
    private clsService: ClsService,
    @InjectModel(Authenticator.name)
    private authenticatorModel: Model<Authenticator>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.config = this.clsService.get('webAuthnConfig');
  }

  @UseGuards(JwtGuard)
  @Get('generate-registration-options')
  async generateRegistration(@Req() req: Request) {
    this.config = this.clsService.get('webAuthnConfig');
    const { id: userId } = req.user as IJWTClaims;
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new HttpException(
        `No user with id of ${userId} exists.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const userAuthenticators: Authenticator[] = user.authenticators;
    const options = generateRegistrationOptions({
      rpID: this.config.rpID,
      rpName: this.config.rpName,
      userID: user._id.toString(),
      userName: user.email,
      userDisplayName: user.displayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'discouraged',
      },
      excludeCredentials: userAuthenticators.map((authenticator) => ({
        id: Buffer.from(authenticator.credentialID),
        type: 'public-key',
        transports: authenticator.transports as AuthenticatorTransport[],
      })),
    });
    this.redisService
      .getClient()
      .set(`challenge_${user._id.toString()}`, options.challenge, 'EX', 600);
    return options;
  }

  @UseGuards(JwtGuard)
  @Post('verify-registration')
  async verifyRegistration(
    @Req() req: Request,
    @Body() body: RegistrationResponseJSON,
  ) {
    this.config = this.clsService.get('webAuthnConfig');
    if (!body) {
      throw new BadRequestException();
    }
    const { id: userID } = req.user as IJWTClaims;
    const registrationChallenge = await this.redisService
      .getClient()
      .get(`challenge_${userID}`);
    if (!registrationChallenge) {
      throw new BadRequestException();
    }
    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: registrationChallenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e);
    }
    const { registrationInfo } = verification;
    const {
      credentialPublicKey,
      credentialID,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;
    const authenticator = new this.authenticatorModel({
      counter,
      credentialBackedUp,
      credentialDeviceType,
      credentialID: Buffer.from(credentialID),
      credentialPublicKey: Buffer.from(credentialPublicKey),
    });
    await authenticator.save();
    await this.userService.saveNewAuthenticator(userID, authenticator);
    await this.redisService.getClient().del(`challenge_${userID}`);
    return { ok: verification.verified };
  }

  @Get('/generate-authentication-options')
  @UseGuards(JwtGuard)
  async generateAuthentication(@Req() req: Request) {
    this.config = this.clsService.get('webAuthnConfig');
    const { id: userID } = req.user as IJWTClaims;
    const user = await this.userService.getUserById(userID);
    if (!user) {
      throw new HttpException(
        `No user with id of ${userID} exists.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: user.authenticators.map((dev) => {
        const ac: PublicKeyCredentialDescriptorFuture = {
          id: Uint8Array.from(dev.credentialID),
          type: 'public-key',
          transports: dev.transports as AuthenticatorTransport[],
        };
        return ac;
      }),
      userVerification: 'preferred',
      rpID: this.config.rpID,
    };
    const options = generateAuthenticationOptions(opts);
    await this.redisService
      .getClient()
      .set(`challenge_${user._id.toString()}`, options.challenge, 'EX', 600);
    return options;
  }

  @Post('/verify-authentication')
  @UseGuards(JwtGuard)
  async verifyAuthentication(
    @Body() body: AuthenticationResponseJSON,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    this.config = this.clsService.get('webAuthnConfig');
    if (!body) {
      throw new BadRequestException();
    }
    const { id: userID } = request.user as IJWTClaims;
    const user = await this.userService.getUserById(userID);
    if (!user) {
      throw new HttpException(
        `No user with id of ${userID} exists.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const challenge = await this.redisService
      .getClient()
      .get(`challenge_${user._id.toString()}`);
    if (!challenge) {
      throw new BadRequestException();
    }
    const bodyCredIDBuffer = base64url.toBuffer(body.rawId);
    const dbAuthenticator: Authenticator & { _id: mongoose.Types.ObjectId } =
      user.authenticators.find((dev) => {
        return isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer);
      }) as unknown as Authenticator & { _id: mongoose.Types.ObjectId };
    const authenticatorDocument = await this.authenticatorModel.findById(
      dbAuthenticator._id,
    );
    if (!dbAuthenticator) {
      throw new BadRequestException('Authenticator not registered!');
    }
    let verification: VerifiedAuthenticationResponse;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge: challenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
        authenticator: {
          credentialPublicKey: dbAuthenticator.credentialPublicKey,
          counter: dbAuthenticator.counter,
          credentialID: dbAuthenticator.credentialID,
          transports: dbAuthenticator.transports as AuthenticatorTransport[],
        },
        requireUserVerification: true,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      console.log(error);
      throw new HttpException('Errors while verifying authentication', 400, {
        cause: error,
      });
    }
    const { verified, authenticationInfo } = verification;
    if (verified) {
      authenticatorDocument.counter = authenticationInfo.newCounter;
    }
    await authenticatorDocument.save();
    await user.save();
    await this.redisService.getClient().del(`challenge_${user._id.toString()}`);
    const jwtPayload: IJWTClaims = {
      id: user._id.toString(),
      is2FAuthenticated: verified,
    };
    res.cookie(
      'jwt',
      await this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
      }),
    );
    res.send({ ok: verified });
  }
}
