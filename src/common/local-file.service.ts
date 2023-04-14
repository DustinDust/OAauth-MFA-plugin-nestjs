import { Injectable } from '@nestjs/common';
import { Mode, ObjectEncodingOptions, OpenMode } from 'node:fs';
import * as fs from 'node:fs/promises';
import { EventEmitter } from 'node:stream';

@Injectable()
export class LocalFileService {
  async dataFromFile<T>(
    path: string,
    options?: { encoding: BufferEncoding; flag: OpenMode },
  ): Promise<T> {
    const file = await fs.readFile(path, options);
    const data = JSON.parse(file) as T;
    return data;
  }

  async dataToFile(
    path: string,
    payload: any,
    options?:
      | BufferEncoding
      | (ObjectEncodingOptions & {
          mode?: Mode;
          flag?: OpenMode;
        } & EventEmitter.Abortable),
  ) {
    const jsonString = JSON.stringify(payload);
    fs.writeFile(path, jsonString, options);
  }
}
