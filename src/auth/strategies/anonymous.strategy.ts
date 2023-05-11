import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-anonymous';

// mixin
export function createAnonymousStrategy(name: string) {
  @Injectable()
  class AnonymousStrategy extends PassportStrategy(Strategy, name) {}
  return new AnonymousStrategy();
}
