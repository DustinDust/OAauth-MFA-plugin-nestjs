import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dtos/create-user.z';
import { ProviderInfo } from './schemas/provider-info.schema';
import { CreateProviderInfoDto } from './dtos/create-provider-info.z';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ProviderInfo.name)
    private providerInfoModel: Model<ProviderInfo>,
  ) {}

  async getUserById(id: string) {
    const us = await this.userModel
      .findOne({
        _id: id,
      })
      .exec();
    return us;
  }

  async createUser(userDto: CreateUserDto) {
    const newUser = new this.userModel(userDto);
    console.log(newUser);
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
