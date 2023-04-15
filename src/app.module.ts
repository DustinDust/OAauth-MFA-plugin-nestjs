import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { IClsStore } from './auth/interfaces/cls-store.interface';
import { CommonModule } from './common/common.module';
import { LocalFileService } from './common/local-file.service';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      global: true,
    }),
    CommonModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          config: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
    }),
    ClsModule.forRootAsync({
      useFactory: async (
        redisService: RedisService,
        localFileService: LocalFileService,
        configService: ConfigService,
      ) => {
        return {
          middleware: {
            mount: true,
            setup: async (cls) => {
              const data = await localFileService.dataFromFile<IClsStore>(
                `${process.cwd()}/cls.json`,
              );
              await redisService
                .getClient()
                .set(
                  configService.get('REDIS_AUTH_CONFIG_KEY') || 'AUTH_CONFIG',
                  JSON.stringify(data),
                );
              console.log(data);
              for (const key in data) {
                cls.set(key, data[key]);
              }
            },
          },
        };
      },
      inject: [RedisService, LocalFileService, ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
