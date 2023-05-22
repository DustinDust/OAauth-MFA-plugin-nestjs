import { UnauthorizedException } from '@nestjs/common';
import { UserDocument } from 'src/auth/schemas/user.schema';

export class TwoFactorUnauthorizedExeption extends UnauthorizedException {
  user: UserDocument;
  message = 'Two factor authentication is required';
  constructor(user: UserDocument) {
    super();
    this.user = user;
  }
}
