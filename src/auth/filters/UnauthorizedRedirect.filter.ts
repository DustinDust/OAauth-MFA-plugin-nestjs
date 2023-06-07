import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { UnauthorizedRedirectException } from '../errors/unauthorized-redirect.exception';

@Catch(UnauthorizedRedirectException)
export class UnauthorizedRedirectExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedRedirectException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    response.status(status).json({
      action: 'redirect',
      payload: exception.to,
    });
  }
}
