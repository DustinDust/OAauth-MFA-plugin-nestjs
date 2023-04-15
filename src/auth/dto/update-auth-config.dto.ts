import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateAuthConfigDto {
  @IsBoolean()
  willAuthenticate: boolean;

  githubProvider: ProviderOptionsDto;
  googleProvider: ProviderOptionsDto;
}

export class ProviderOptionsDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  clientID: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  callBackURL: string;

  @IsString()
  @IsOptional()
  scope?: string;
}
