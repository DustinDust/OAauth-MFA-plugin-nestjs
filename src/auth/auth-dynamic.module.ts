import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { HttpModule } from '@nestjs/axios';
import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Global,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ClsModule, ClsService } from 'nestjs-cls';
import { RequestScopeModule } from 'nj-request-scope';
import { AuthController } from './controllers/auth.controller';
import { AuthConfigController } from './controllers/auto-config.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { WebAuthnController } from './controllers/webauthn.controller';
import { GithubGuard } from './guards/github.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { TwoFactorGuard } from './guards/two-factor.guard';
import {
  clsFactory,
  githubStrategyProxyFactory,
  googleStrategyProxyFactory,
} from './helpers';
import {
  getConfigToken,
  JWT_SECRET,
  MONGO_URI,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from './helpers/constants';
import {
  Authenticator,
  AuthenticatorSchema,
} from './schemas/authenticator.schema';
import { OtpInfo, OtpInfoSchema } from './schemas/otp-info.schema';
import {
  ProviderInfo,
  ProviderInfoSchema,
} from './schemas/provider-info.schema';
import { User, UserDocument, UserSchema } from './schemas/user.schema';
import { AuthService } from './services/auth.service';
import { LocalFileService } from './services/local-file.service';
import { TwoFactorAuthenticationService } from './services/otp.service';
import { UserService } from './services/user.service';
import { TwoFactorAuthStrategy } from './strategies/2fa.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

// These applies to non-async initialization only;
export interface IAuthModuleOptions {
  serveStatic: {
    rootPath: string;
    exclude: string[];
  };
  cls: {
    configFilePath: string;
  };
  env: {
    prefix: string;
  };
  routes: {
    redirect: {
      successAuthenticatedWithProvider:
        | string
        | ((user: UserDocument) => string);
      otpAuthenticate: string | ((user: UserDocument) => string);
      otpSetup: string | ((user: UserDocument) => string);
      webAuthnRegister: string | ((user: UserDocument) => string);
      webAuthnAuthenticate: string | ((user: UserDocument) => string);
    };
  };
}

export const {
  ConfigurableModuleClass: DynamicAuthModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<IAuthModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('create')
  .build();

export type AuthModuleOptions = typeof OPTIONS_TYPE;
export type AuthModuleAsyncOptions = typeof ASYNC_OPTIONS_TYPE & {
  ENV_PREFIX?: string;
};

@Global()
@Module({})
export class AuthModule extends DynamicAuthModuleClass {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        RedisModule.forRootAsync({
          inject: [ConfigService],
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const hostConfigToken = getConfigToken(
              options.env.prefix,
              REDIS_HOST,
            );
            const portConfigToken = getConfigToken(
              options.env.prefix,
              REDIS_PORT,
            );
            const pwConfigToken = getConfigToken(
              options.env.prefix,
              REDIS_PASSWORD,
            );
            return {
              config: {
                host: configService.get(hostConfigToken),
                port: configService.get(portConfigToken),
                password: configService.get(pwConfigToken),
              },
            };
          },
        }),
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const uriConfigToken = getConfigToken(
              options.env.prefix,
              MONGO_URI,
            );
            return {
              uri: configService.get(uriConfigToken),
            };
          },
        }),
        PassportModule.register({ session: false }),
        ServeStaticModule.forRoot({
          rootPath: options.serveStatic.rootPath,
          exclude: options.serveStatic.exclude,
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
          useFactory: (
            r: RedisService,
            l: LocalFileService,
            c: ConfigService,
          ) => clsFactory(r, l, c, options),
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
        JwtModule.register({
          global: true,
        }),
      ],
      controllers: [
        AuthController,
        AuthConfigController,
        WebAuthnController,
        TwoFactorController,
      ],
      providers: [
        GithubGuard,
        GoogleGuard,
        JwtGuard,
        TwoFactorGuard,
        {
          provide: JwtStrategy,
          useFactory: (configService: ConfigService) => {
            return new JwtStrategy(
              configService.get(getConfigToken(options.env.prefix, JWT_SECRET)),
            );
          },
          inject: [ConfigService],
        },
        {
          provide: TwoFactorAuthStrategy,
          useFactory: (cf: ConfigService, us: UserService, cls: ClsService) => {
            return new TwoFactorAuthStrategy(us, cls, cf, options);
          },
          inject: [ConfigService, UserService, ClsService],
        },
        LocalFileService,
        UserService,
        {
          provide: AuthService,
          useFactory: async (
            u: UserService,
            j: JwtService,
            c: ConfigService,
          ) => {
            return new AuthService(u, options, j, c);
          },
          inject: [UserService, JwtService, ConfigService],
        },
        {
          provide: TwoFactorAuthenticationService,
          useFactory: (
            u: UserService,
            c: ConfigService,
            o: AuthModuleOptions = options,
          ) => {
            return new TwoFactorAuthenticationService(u, c, o);
          },
          inject: [UserService, ConfigService],
        },
      ],
      exports: [
        UserService,
        LocalFileService,
        AuthService,
        GithubGuard,
        GoogleGuard,
        JwtGuard,
        TwoFactorGuard,
      ],
    };
  }
}
