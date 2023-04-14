import { Module } from '@nestjs/common';
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
    ClsModule.forRootAsync({
      useFactory: async (localFileService: LocalFileService) => {
        return {
          middleware: {
            mount: true,
            setup: async (cls, req, res) => {
              const data = await localFileService.dataFromFile<IClsStore>(
                `${process.cwd()}/cls.json`,
              );
              console.log(data);
              for (const key in data) {
                cls.set(key, data[key]);
              }
            },
          },
        };
      },
      inject: [LocalFileService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
