import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const ProviderOptionsZ = z.object({
  active: z.boolean(),
  clientSecret: z.string(),
  clientID: z.string(),
  callbackURL: z.string(),
  scope: z.string().optional(),
});

export const UpdateAuthConfigZ = z.object({
  willAuthenticate: z.boolean(),
  mfaEnforce: z.boolean(),
  mfaType: z.enum(['otp', 'webauthn']),
  githubProviderOptions: ProviderOptionsZ,
  googleProviderOptions: ProviderOptionsZ,
  webAuthnConfig: z.object({
    rpName: z.string(),
    rpID: z.string(),
    origin: z.string(),
  }),
});

export class UpdateAuthConfigDto extends createZodDto(UpdateAuthConfigZ) {}
