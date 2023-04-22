import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const CreateProviderInfoZ = z.object({
  name: z.string(),
  id: z.string(),
  token: z.string(),
});

export class CreateProviderInfoDto extends createZodDto(CreateProviderInfoZ) {}
