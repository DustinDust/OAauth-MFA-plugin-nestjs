import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { LocalFileService } from 'src/common/local-file.service';
import { UpdateAuthConfigDto } from './dto/update-auth-config.dto';
import { IClsStore } from './interfaces/cls-store.interface';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Controller({
  path: 'auth-config',
  // host: 'localhost',
})
export class AuthConfigController {
  constructor(
    private readonly localFileService: LocalFileService,
    @InjectRedis() private readonly redis: Redis,
    private configService: ConfigService,
  ) {}

  get redisAuthConfigKey() {
    return this.configService.get('REDIS_AUTH_CONFIG_KEY');
  }

  @Get('')
  async getAuthConfigDetails() {
    const redisData = await this.redis.get(
      this.configService.get('REDIS_AUTH_CONFIG_KEY'),
    );
    if (!redisData) {
      const localFileData = await this.localFileService.dataFromFile<IClsStore>(
        `${process.cwd()}/cls.json`,
      );
      await this.redis.set(
        this.configService.get('REDIS_AUTH_CONFIG_KEY'),
        JSON.stringify(localFileData),
      );
      return localFileData;
    } else {
      return JSON.parse(redisData);
    }
  }

  @Post()
  async updateConfigDetails(@Body() dto: UpdateAuthConfigDto) {
    const currentConfig = await this.localFileService.dataFromFile<IClsStore>(
      `${process.cwd()}/cls.json`,
    );
    await this.localFileService.dataToFile(`${process.cwd()}/cls.json`, {
      ...currentConfig,
      ...dto,
    });
    await this.redis.set(
      this.redisAuthConfigKey,
      JSON.stringify({ ...currentConfig, ...dto }),
    );
    return {
      ...currentConfig,
      ...dto,
    };
  }
}
