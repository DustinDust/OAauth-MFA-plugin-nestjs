import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClsModule, ClsService } from 'nestjs-cls';
import { RequestScopeModule } from 'nj-request-scope';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthConfigController } from './auto-config.controller';
import { GithubGuard } from './guards/github.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

// const GoogleStrategyFactory = {
//   provide: 'GOOGLE_OIDC_FACTORY',
//   useFactory: async () => {
//     const issuer = await Issuer.discover(
//       'https://accounts.google.com/.well-known/openid-configuration',
//     );
//     console.log(issuer);
//     const client = new issuer.Client({
//       client_id:
//         '527158108169-ocok1u080nt9thrum0trnu2g011cakb8.apps.googleusercontent.com',
//       client_secret: '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',
//     });
//   },
// };

// const GithubStrategyFactory = {
//   provide: 'GITHUB_OIDC_FACTORY',
//   useFactory: async () => {
//     const issuer = new Issuer({
//       issuer: 'https://github.com',
//       authorization_endpoint: 'https://github.com/login/oauth/authorize',
//       token_endpoint: 'https://github.com/login/oauth/access_token',
//       userinfo_endpoint: 'https://api.github.com/user',
//     });
//     console.log(issuer);
//     const client = new issuer.Client({
//       client_id: '1827e2b0a178598e180f',
//       client_secret: '164689da5dda4f4d6cf8c441ea24c56b83cf37f6',
//     });
//   },
// };

@Module({
  imports: [
    PassportModule.register({ session: false }),
    HttpModule.register({}),
    RequestScopeModule,
    ClsModule.forFeatureAsync({
      provide: 'GITHUB_STRATEGY',
      useFactory: (clsService: ClsService) => {
        return new GithubStrategy(clsService);
      },
      inject: [ClsService],
    }),
    ClsModule.forFeatureAsync({
      provide: 'GOOGLE_STRATEGY',
      useFactory: (clsService: ClsService) => {
        return new GoogleStrategy(clsService);
      },
      inject: [ClsService],
    }),
  ],
  controllers: [AuthController, AuthConfigController],
  providers: [
    // GithubStrategy,
    // GoogleStrategy,
    GithubGuard,
    GoogleGuard,
    JwtGuard,
    JwtStrategy,
    AuthService,
  ],
})
export class AuthModule {}
