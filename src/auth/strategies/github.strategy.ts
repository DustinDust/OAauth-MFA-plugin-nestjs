import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ClsService, InjectableProxy } from 'nestjs-cls';
import { Strategy } from 'passport-github2';
import { Profile } from 'passport-google-oauth';

@InjectableProxy()
export class GithubStrategy extends PassportStrategy(Strategy, 'github-oauth') {
  constructor(clsService: ClsService) {
    super(clsService.get('githubProviderOptions'));
    // super({
    //   clientID: '1827e2b0a178598e180f',
    //   clientSecret: '164689da5dda4f4d6cf8c441ea24c56b83cf37f6',
    //   callbackURL: 'http://localhost:5173/api/auth/github/callback',
    // });
    console.log('github strat run');
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // console.log(accessToken, refreshToken, profile);
    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
