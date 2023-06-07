import { Injectable } from '@nestjs/common';
import { ClsMiddleware } from 'nestjs-cls';
import { LocalFileService } from '../services/local-file.service';
import { IClsStore } from '../interfaces/cls-store.interface';

@Injectable()
export class ClsSetupMiddleware extends ClsMiddleware {
  localFileService = new LocalFileService();
  constructor() {
    super({
      setup: async (cls, req, res) => {
        const data = await this.localFileService.dataFromFile<IClsStore>(
          `${process.cwd()}/cls.json`,
        );
        for (const key in data) {
          cls.set(key, data[key]);
        }
      },
    });
  }
}
