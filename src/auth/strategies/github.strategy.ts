import { PassportStrategy } from '@nestjs/passport';
import { ClsService, InjectableProxy } from 'nestjs-cls';
import { Strategy } from 'passport-github2';
import { Profile } from 'passport-github2';
import { UserService } from 'src/user/user.service';

@InjectableProxy()
export class GithubStrategy extends PassportStrategy(Strategy, 'github-oauth') {
  userService: UserService;
  constructor(clsService: ClsService, userSevice: UserService) {
    super(clsService.get('githubProviderOptions'));
    console.log('github strat run');
    this.userService = userSevice;
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const currentUser = await this.userService.findUserByProviderId(
      profile.id,
      profile.provider,
    );
    if (currentUser) {
      return {
        user: currentUser,
        accessToken,
        refreshToken,
        profile,
      };
    } else {
      // link them
      const newUser = await this.userService.createUser({
        displayName: profile.displayName,
        email: profile.profileUrl,
        photo: profile.photos[0].value,
      });
      await this.userService.linkProvider(newUser._id.toString(), {
        id: profile.id,
        name: 'github',
        token: accessToken,
      });
      return {
        user: newUser,
        accessToken,
        refreshToken,
        profile,
      };
    }
  }
}
