import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppService', () => {
  let appService: AppService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    appService = moduleRef.get<AppService>(AppService);
  });
  describe('getHello', () => {
    it('Should return `Hello World!`', async () => {
      const res = `Hello World!`;
      // jest.spyOn(appService, 'getHello').mockImplementation(() => res);
      expect(appService.getHello()).toBe(res);
    });
  });
});
