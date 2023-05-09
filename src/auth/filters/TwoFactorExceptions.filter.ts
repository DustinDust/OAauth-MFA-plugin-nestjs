import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { TwoFactorUnauthorizedExeption } from '../errors/2fa-unauthorized.error';

@Catch(TwoFactorUnauthorizedExeption)
export class TwoFactorUnauthorizedFilter implements ExceptionFilter {
  catch(exception: TwoFactorUnauthorizedExeption, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (exception.user.otp) {
      response
        .status(status)
        .redirect(`/2fa/authenticate/${exception.user._id}`);
    } else response.status(status).redirect(`/2fa/setup/${exception.user._id}`);
  }
}
