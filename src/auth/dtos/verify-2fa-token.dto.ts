import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const Verify2FATokenZ = z
  .object({
    token: z.string().length(6),
  })
  .required();

export class Verify2FATokenDto extends createZodDto(Verify2FATokenZ) {}
