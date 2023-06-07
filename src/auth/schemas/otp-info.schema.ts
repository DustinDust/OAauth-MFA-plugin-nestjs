import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpInfoDocument = HydratedDocument<OtpInfo>;

@Schema({ timestamps: true })
export class OtpInfo {
  @Prop()
  secret: string;
}

export const OtpInfoSchema = SchemaFactory.createForClass(OtpInfo);
