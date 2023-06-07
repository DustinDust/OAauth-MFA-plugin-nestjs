import { ClsService } from 'nestjs-cls';
import { UserService } from 'src/auth/services/user.service';
import { createAnonymousStrategy } from '../strategies/anonymous.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';

export const googleStrategyProxyFactory = (
  clsService: ClsService,
  userService: UserService,
) => {
  const active = clsService.get('googleProviderOptions').active;

  if (!active) {
    return createAnonymousStrategy('google-oauth');
  }
  return new GoogleStrategy(clsService, userService);
};
