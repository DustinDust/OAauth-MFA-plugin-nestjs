import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const CreateUserZ = z.object({
  displayName: z.string(),
  email: z.string().email(),
  photo: z.string().url(),
});

export class CreateUserDto extends createZodDto(CreateUserZ) {}
