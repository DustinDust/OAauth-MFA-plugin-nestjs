import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RequestScope } from 'nj-request-scope';

@Injectable()
export class AuthService {
  GITHUB_USER_ENDPOINT = 'https://api.github.com/user';
  GOOGLE_USER_ENDPOINT = 'https://www.googleapis.com/oauth2/v1/userinfo';
  constructor(private readonly httpService: HttpService) {}
  async getUserInfo(accessToken: string, provider: 'google' | 'github') {
    if (provider === 'github') {
      const res = await axios.get(this.GITHUB_USER_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      return {
        displayName: res.data.displayName,
        id: res.data.id,
        photo: res.data.avatar_url,
        email: res.data.email,
        provider: provider,
      };
    }
    if (provider === 'google') {
      const res = await axios.get(this.GOOGLE_USER_ENDPOINT, {
        params: {
          access_token: accessToken,
          alt: 'json',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return {
        displayName: res.data.name,
        id: res.data.id,
        photo: res.data.picture,
        email: res.data.email,
        provider: provider,
      };
    }
  }
}
