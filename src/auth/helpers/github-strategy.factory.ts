import { ClsService } from 'nestjs-cls';
import { UserService } from 'src/user/user.service';
import { createAnonymousStrategy } from '../strategies/anonymous.strategy';
import { GithubStrategy } from '../strategies/github.strategy';

export const githubStrategyProxyFactory = (
  clsService: ClsService,
  userService: UserService,
) => {
  const active = clsService.get('githubProviderOptions').active;
  if (!active) {
    return createAnonymousStrategy('github-oauth');
  }
  return new GithubStrategy(clsService, userService);
};
