import {Test, TestingModule} from '@nestjs/testing';
import {AppService} from './app.service';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appService).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return an empty string', () => {
      expect(appService.getHealth()).toBe('');
    });
  });

  describe('ping', () => {
    it('should return pong string', () => {
      expect(appService.ping()).toBe('pong');
    });
  });
});
