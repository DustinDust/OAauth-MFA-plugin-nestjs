import { PassportStrategy } from '@nestjs/passport';
import { ClsService, InjectableProxy } from 'nestjs-cls';
import { Profile } from 'passport-github2';
import { OAuth2Strategy } from 'passport-google-oauth';
import { UserService } from 'src/user/user.service';

@InjectableProxy()
export class GoogleStrategy extends PassportStrategy(
  OAuth2Strategy,
  'google-oauth',
) {
  userService: UserService;
  constructor(clsService: ClsService, userService: UserService) {
    super(clsService.get('googleProviderOptions'));
    console.log('google strat run');
    this.userService = userService;
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const currentUser = await this.userService.findUserByProviderId(
      profile.id,
      profile.provider,
    );
    // console.log(currentUser);
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
        email: profile.emails[0].value,
        photo: profile.photos[0].value,
      });
      await this.userService.linkProvider(newUser._id.toString(), {
        id: profile.id,
        name: 'google',
        token: accessToken,
      });
      // console.log(newUser);
      return {
        user: newUser,
        accessToken,
        refreshToken,
        profile,
      };
    }
  }
}
