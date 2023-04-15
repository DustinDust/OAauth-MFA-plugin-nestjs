import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleGuard extends AuthGuard('google-oauth') {
  constructor(private clsService: ClsService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (
      !this.clsService.get('willAuthenticate') ||
      !this.clsService.get('googleProviderOptions').active
    ) {
      return true;
    } else {
      return super.canActivate(context);
    }
  }
}
