import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import base64url from 'base64url';
import { Request } from 'express';
import { Model } from 'mongoose';
import { UserService } from 'src/auth/services/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { type IJWTClaims } from '../interfaces/jwt-claims.interface';
import { Authenticator } from '../schemas/authenticator.schema';

@Controller('/webauthn')
export class WebAuthnController {
  config = {
    rpName: 'DemoWebAutnApp',
    rpID: 'localhost',
    origin: `http://locahost`,
  };
  constructor(
    private redisService: RedisService,
    private userService: UserService,
    @InjectModel(Authenticator.name)
    private authenticatorModel: Model<Authenticator>,
  ) {}

  @UseGuards(JwtGuard)
  @Get('generate-registration-options')
  async generateRegistration(@Req() req: Request) {
    const { id: userId } = req.user as IJWTClaims;
    const user = await this.userService.getUserById(userId);
    const userAuthenticators: Authenticator[] = user.authenticators;
    const options = generateRegistrationOptions({
      ...this.config,
      userID: user._id.toString(),
      userName: user.displayName,
      attestationType: 'none',
      excludeCredentials: userAuthenticators.map((authenticator) => ({
        id: authenticator.credentialID,
        type: 'public-key',
        transports: authenticator.transports,
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
    const authenticator: Authenticator = new this.authenticatorModel({
      counter,
      credentialBackedUp,
      credentialDeviceType,
      credentialID,
      credentialPublicKey,
    });
    await this.userService.saveNewAuthenticator(userID, authenticator);
    return verification;
  }

  @Get('/generate-authentication-options')
  @UseGuards(JwtGuard)
  async generateAuthentication(@Req() req: Request) {
    const { id: userID } = req.user as IJWTClaims;
    const user = await this.userService.getUserById(userID);
    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: user.authenticators.map((dev) => {
        return {
          id: dev.credentialID,
          type: 'public-key',
          transports: dev.transports,
        };
      }),
      userVerification: 'required',
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
  ) {
    const { id: userID } = request.user as IJWTClaims;
    const user = await this.userService.getUserById(userID);
    const challenge = await this.redisService
      .getClient()
      .get(`challenge_${user._id.toString()}`);
    if (!challenge) {
      throw new BadRequestException();
    }
    const bodyCredIDBuffer = base64url.toBuffer(body.rawId);
    const dbAuthenticator = user.authenticators.find((dev) => {
      isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer);
    });
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
        authenticator: dbAuthenticator,
        requireUserVerification: true,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      throw new BadRequestException(error);
    }
    const { verified, authenticationInfo } = verification;
    if (verified) {
      dbAuthenticator.counter = authenticationInfo.newCounter;
    }
    await user.save();
    await this.redisService.getClient().del(`challenge_${user._id.toString()}`);
    return { verified };
  }
}
