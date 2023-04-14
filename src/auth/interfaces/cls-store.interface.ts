export interface IClsStore {
  willAuthenticate: boolean;
  googleProviderOptions: IProviderOptions;
  githubProviderOptions: IProviderOptions;
}

interface IProviderOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string;
}
