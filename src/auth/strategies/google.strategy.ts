import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ClsService, InjectableProxy } from 'nestjs-cls';
import { Profile } from 'passport-github2';
import { OAuth2Strategy } from 'passport-google-oauth';

@InjectableProxy()
export class GoogleStrategy extends PassportStrategy(
  OAuth2Strategy,
  'google-oauth',
) {
  constructor(clsService: ClsService) {
    super(clsService.get('googleProviderOptions'));
    console.log('google strat run');
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
