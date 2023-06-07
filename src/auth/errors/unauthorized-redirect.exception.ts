import { UnauthorizedException } from '@nestjs/common';
import { UserDocument } from 'src/auth/schemas/user.schema';

export class UnauthorizedRedirectException extends UnauthorizedException {
  user: UserDocument;
  // Why must redirect?
  message = 'Unauthorized, redirection commenced.';
  // where to?
  to: string;

  constructor(user: UserDocument, to: string, message?: string) {
    super();
    this.user = user;
    this.to = to;
    if (message) {
      this.message = message;
    }
  }
}
