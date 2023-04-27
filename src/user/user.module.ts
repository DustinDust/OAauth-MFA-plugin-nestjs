import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpInfo, OtpInfoSchema } from './schemas/otp-info.schema';
import {
  ProviderInfo,
  ProviderInfoSchema,
} from './schemas/provider-info.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ProviderInfo.name, schema: ProviderInfoSchema },
      { name: OtpInfo.name, schema: OtpInfoSchema },
    ]),
  ],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
