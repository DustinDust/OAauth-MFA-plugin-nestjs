import { Controller, Get } from '@nestjs/common';
import { LocalFileService } from 'src/common/local-file.service';
import { IClsStore } from './interfaces/cls-store.interface';

@Controller({
  path: 'auth-config',
  host: 'localhost',
})
export class AuthConfigController {
  constructor(private readonly localFileService: LocalFileService) {}
  @Get('')
  async getAuthConfigDetails() {
    return await this.localFileService.dataFromFile<IClsStore>(
      `${process.cwd()}/cls.json`,
    );
  }
}
