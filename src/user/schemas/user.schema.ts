import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
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

  @Prop()
  hasOTP: boolean;

  @Prop()
  createdAt: string;

  @Prop()
  updatedAt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
