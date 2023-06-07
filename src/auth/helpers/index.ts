import { Request } from 'express';

export function fromCookies(req: Request) {
  let token = undefined;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
}

export * from './cls-store.factory';
export * from './cls-store.zod';
export * from './github-strategy.factory';
export * from './google-strategy.factory';
