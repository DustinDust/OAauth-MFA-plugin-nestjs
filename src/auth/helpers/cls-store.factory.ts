import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsModuleFactoryOptions } from 'nestjs-cls';
import { LocalFileService } from 'src/auth/services/local-file.service';
import { AuthModuleOptions } from '../auth-dynamic.module';
import { IClsStore } from '../interfaces/cls-store.interface';
import { clsZod } from './cls-store.zod';
import { getConfigToken, REDIS_AUTH_CONFIG_KEY } from './constants';

export const clsFactory = async (
  redisService: RedisService,
  localFileService: LocalFileService,
  configService: ConfigService,
  options: AuthModuleOptions,
): Promise<ClsModuleFactoryOptions> => {
  const logger = new Logger();
  return {
    middleware: {
      mount: true,
      setup: async (cls) => {
        const configString = await redisService
          .getClient()
          .get(
            configService.get(
              getConfigToken(options.env.prefix, REDIS_AUTH_CONFIG_KEY),
            ) || 'AUTH_CONFIG',
          );
        if (!configString) {
          logger.log(
            'Fail to retrieve data from redis, procceeding with local config files',
          );
          const data = await localFileService.dataFromFile<IClsStore>(
            options.cls.configFilePath,
          );
          console.log(data);
          let zodParsedData;
          try {
            zodParsedData = clsZod.parse(data);
            console.log(zodParsedData);
          } catch (e) {
            logger.error(e);
          }
          await redisService
            .getClient()
            .set(
              configService.get(
                getConfigToken(options.env.prefix, REDIS_AUTH_CONFIG_KEY),
              ) || 'AUTH_CONFIG',
              JSON.stringify(zodParsedData),
            );
          for (const key in zodParsedData) {
            cls.set(key, data[key]);
          }
          return;
        } else {
          const config = JSON.parse(configString);
          let parsedConfig;
          try {
            parsedConfig = clsZod.parse(config);
            console.log(parsedConfig);
          } catch (e) {
            logger.error(e);
          }
          for (const key in parsedConfig) {
            cls.set(key, config[key]);
          }
        }
      },
    },
  };
};
