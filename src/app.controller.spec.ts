import {Test, TestingModule} from '@nestjs/testing';
import {AppController} from './app.controller';
import {AppService} from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('Health check controller', () => {
    it('should return an empty string', () => {
      expect(appController.getHealth()).toBe('');
    });
  });

  describe('ping', () => {
    it('should return pong string', () => {
      expect(appController.ping()).toBe('pong');
    });
  });
});
