import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProviderInfoDocument = HydratedDocument<ProviderInfo>;

@Schema({ timestamps: true })
export class ProviderInfo {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  token: string;
}

export const ProviderInfoSchema = SchemaFactory.createForClass(ProviderInfo);
