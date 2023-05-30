import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CredentialDeviceType } from '@simplewebauthn/typescript-types';
import { HydratedDocument } from 'mongoose';

export type AuthenticatorDocument = HydratedDocument<Authenticator>;

@Schema({ timestamps: true })
export class Authenticator {
  @Prop({ type: Buffer })
  credentialID: Buffer;

  @Prop({ type: Buffer })
  credentialPublicKey: Buffer;

  @Prop()
  counter: number;

  @Prop({ enum: ['singleDevice', 'multiDevice'] })
  credentialDeviceType: CredentialDeviceType;

  @Prop()
  credentialBackedUp: boolean;

  @Prop({ type: [{ enum: ['ble', 'hybrid', 'internal', 'nfc', 'usb'] }] })
  transports?: string[];
}

export const AuthenticatorSchema = SchemaFactory.createForClass(Authenticator);
