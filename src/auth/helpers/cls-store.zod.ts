import { z } from 'zod';

export const clsZod = z.object({
  willAuthenticate: z.boolean().default(false),
  mfaEnforce: z.boolean().default(false),
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
