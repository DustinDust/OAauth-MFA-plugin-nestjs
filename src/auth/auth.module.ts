import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClsModule, ClsService } from 'nestjs-cls';
import { RequestScopeModule } from 'nj-request-scope';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthConfigController } from './controllers/auto-config.controller';
import { GithubGuard } from './guards/github.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFactorController } from './controllers/two-factor.controller';
import { TwoFactorAuthenticationService } from './services/otp.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TwoFactorGuard } from './guards/two-factor.guard';
import { TwoFactorAuthStrategy } from './strategies/2fa.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ session: false }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      exclude: ['/api/(.*)'],
    }),
    HttpModule.register({}),
    RequestScopeModule,
    ClsModule.forFeatureAsync({
      provide: 'GITHUB_STRATEGY',
      imports: [UserModule],
      useFactory: (clsService: ClsService, userService: UserService) => {
        return new GithubStrategy(clsService, userService);
      },
      inject: [ClsService, UserService],
    }),
    ClsModule.forFeatureAsync({
      provide: 'GOOGLE_STRATEGY',
      imports: [UserModule],
      useFactory: (clsService: ClsService, userService: UserService) => {
        return new GoogleStrategy(clsService, userService);
      },
      inject: [ClsService, UserService],
    }),
  ],
  controllers: [AuthController, AuthConfigController, TwoFactorController],
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
  ],
})
export class AuthModule {}
