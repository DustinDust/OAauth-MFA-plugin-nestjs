import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Authenticator } from 'src/auth/schemas/authenticator.schema';
import { OtpInfo } from './otp-info.schema';
import { ProviderInfo } from './provider-info.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  displayName: string;

  @Prop()
  email: string;

  @Prop()
  photo: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProviderInfo' }],
  })
  providers: ProviderInfo[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Authenticator' }],
  })
  authenticators: Authenticator[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OtpInfo',
  })
  otp: OtpInfo;

  @Prop()
  isMfaEnabled: boolean;

  @Prop()
  createdAt: string;

  @Prop()
  updatedAt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
