import { Global, Module } from '@nestjs/common';
import { LocalFileService } from './local-file.service';

@Global()
@Module({
  providers: [LocalFileService],
  exports: [LocalFileService],
})
export class CommonModule {}
