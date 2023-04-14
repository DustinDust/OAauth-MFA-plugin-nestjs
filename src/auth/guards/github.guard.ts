import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class GithubGuard extends AuthGuard('github-oauth') {
  constructor(private clsService: ClsService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.clsService.get('willAuthenticate')) {
      return true;
    } else return super.canActivate(context);
  }
}
