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
  githubProviderOptions: ProviderOptionsZ,
  googleProviderOptions: ProviderOptionsZ,
});

export class UpdateAuthConfigDto extends createZodDto(UpdateAuthConfigZ) {}
