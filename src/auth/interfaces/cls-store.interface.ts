export interface IClsStore {
  willAuthenticate: boolean;
  mfaEnforce: boolean;
  mfaType: 'otp' | 'webauthn';
  googleProviderOptions: IProviderOptions;
  githubProviderOptions: IProviderOptions;
  webAuthnConfig: IWebauthnConfig;
}

export interface IProviderOptions {
  active: boolean;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string;
}

export interface IWebauthnConfig {
  rpName: string;
  rpID: string;
  origin: string;
}
