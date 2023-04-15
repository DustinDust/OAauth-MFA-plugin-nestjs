import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ClsService, InjectableProxy } from 'nestjs-cls';
import { Strategy } from 'passport-github2';
import { Profile } from 'passport-google-oauth';

@InjectableProxy()
export class GithubStrategy extends PassportStrategy(Strategy, 'github-oauth') {
  constructor(clsService: ClsService) {
    super(clsService.get('githubProviderOptions'));
    console.log('github strat run');
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
