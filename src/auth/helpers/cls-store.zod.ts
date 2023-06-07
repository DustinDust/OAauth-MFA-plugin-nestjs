import { z } from 'zod';

export const clsZod = z.object({
  willAuthenticate: z.boolean().default(false),
  mfaEnforce: z.boolean().default(false),
  mfaType: z.enum(['webauthn', 'otp']).default('otp'),
  webAuthnConfig: z.object({
    rpName: z.string(),
    rpID: z.string(),
    origin: z.string().url(),
  }),
  githubProviderOptions: z.object({
    active: z.boolean().default(false),
    clientID: z.string().default(''),
    clientSecret: z.string().default(''),
    callbackURL: z.string().default(''),
    scope: z.string().default(''),
  }),
  googleProviderOptions: z.object({
    active: z.boolean().default(false),
    clientID: z.string().default(''),
    clientSecret: z.string().default(''),
    callbackURL: z.string().default(''),
    scope: z.string().default(''),
  }),
});
