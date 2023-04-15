export interface IClsStore {
  willAuthenticate: boolean;
  googleProviderOptions: IProviderOptions;
  githubProviderOptions: IProviderOptions;
}

export interface IProviderOptions {
  active: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string;
}
