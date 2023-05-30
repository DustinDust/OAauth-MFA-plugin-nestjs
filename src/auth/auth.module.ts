import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClsModule, ClsService } from 'nestjs-cls';
import { RequestScopeModule } from 'nj-request-scope';
import { UserService } from 'src/auth/services/user.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthConfigController } from './controllers/auto-config.controller';
import { GithubGuard } from './guards/github.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFactorController } from './controllers/two-factor.controller';
import { TwoFactorAuthenticationService } from './services/otp.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TwoFactorGuard } from './guards/two-factor.guard';
import { TwoFactorAuthStrategy } from './strategies/2fa.strategy';
import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { LocalFileService } from 'src/auth/services/local-file.service';
import { clsFactory } from './helpers/cls-store.factory';
import { githubStrategyProxyFactory } from './helpers/github-strategy.factory';
import { googleStrategyProxyFactory } from './helpers/google-strategy.factory';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Authenticator,
  AuthenticatorSchema,
} from './schemas/authenticator.schema';
import { WebAuthnController } from './controllers/webauthn.controller';
import { User, UserSchema } from './schemas/user.schema';
import { OtpInfo, OtpInfoSchema } from './schemas/otp-info.schema';
import {
  ProviderInfo,
  ProviderInfoSchema,
} from './schemas/provider-info.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          config: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
    }),
    PassportModule.register({ session: false }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      exclude: ['/api/(.*)'],
    }),
    MongooseModule.forFeature([
      { name: Authenticator.name, schema: AuthenticatorSchema },
      { name: User.name, schema: UserSchema },
      { name: OtpInfo.name, schema: OtpInfoSchema },
      { name: ProviderInfo.name, schema: ProviderInfoSchema },
    ]),
    HttpModule.register({}),
    RequestScopeModule,
    ClsModule.forRootAsync({
      useFactory: clsFactory,
      inject: [RedisService, LocalFileService, ConfigService],
    }),
    ClsModule.forFeatureAsync({
      provide: 'GITHUB_STRATEGY',
      imports: [AuthModule],
      useFactory: githubStrategyProxyFactory,
      inject: [ClsService, UserService],
    }),
    ClsModule.forFeatureAsync({
      provide: 'GOOGLE_STRATEGY',
      imports: [AuthModule],
      useFactory: googleStrategyProxyFactory,
      inject: [ClsService, UserService],
    }),
  ],
  controllers: [
    AuthController,
    AuthConfigController,
    TwoFactorController,
    WebAuthnController,
  ],
  providers: [
    GithubGuard,
    GoogleGuard,
    JwtGuard,
    TwoFactorGuard,
    {
      provide: 'JWT_STRATEGY',
      useFactory: (configService: ConfigService) => {
        return new JwtStrategy(configService);
      },
      inject: [ConfigService],
    },
    TwoFactorAuthStrategy,
    AuthService,
    TwoFactorAuthenticationService,
    UserService,
    LocalFileService,
  ],
  exports: [UserService],
})
export class AuthModule {}
