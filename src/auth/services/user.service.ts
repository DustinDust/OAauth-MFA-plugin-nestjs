import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.z';
import { ProviderInfo } from '../schemas/provider-info.schema';
import { CreateProviderInfoDto } from '../dtos/create-provider-info.z';
import { OtpInfo } from '../schemas/otp-info.schema';
import { Authenticator } from '../schemas/authenticator.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ProviderInfo.name)
    private providerInfoModel: Model<ProviderInfo>,
    @InjectModel(OtpInfo.name) private otpInfoModel: Model<OtpInfo>,
  ) {}

  async getUserById(id: string) {
    const us = await this.userModel
      .findOne({
        _id: id,
      })
      .populate('otp')
      .populate('providers')
      .populate('authenticators')
      .exec();
    return us;
  }

  async createUser(userDto: CreateUserDto) {
    const newUser = new this.userModel(userDto);
    return await newUser.save();
  }

  async linkProvider(userid: string, info: CreateProviderInfoDto) {
    const n = new this.providerInfoModel(info);
    const newPvdI = await n.save();
    const user = await this.userModel.findById(userid);
    if (!user) {
      return;
    } else {
      user.providers = [...user.providers, newPvdI];
      await user.save();
    }
  }

  async updateOtpInfo(id: string, secret: string) {
    const otpInfo = new this.otpInfoModel({
      secret: secret,
    });
    await otpInfo.save();
    return await this.userModel
      .findByIdAndUpdate(id, {
        $set: {
          otp: otpInfo,
        },
      })
      .exec();
  }

  async enableOtp(id: string) {
    return await this.userModel.findByIdAndUpdate(id, {
      $set: {
        isOtpEnabled: true,
      },
    });
  }

  async disableOtp(id: string) {
    return await this.userModel.findByIdAndUpdate(id, {
      $set: {
        isOtpEnabled: false,
      },
    });
  }

  async saveNewAuthenticator(id: string, authenticator: Authenticator) {
    const user = await this.userModel.findById(id);
    user.authenticators = [...user.authenticators, authenticator];
    return await user.save();
  }

  async findUserByProviderId(id: string, provider: string) {
    const p = await this.providerInfoModel.find({
      id: id,
      name: provider,
    });
    const user = await this.userModel.findOne({
      providers: p,
    });
    return user;
  }
}
