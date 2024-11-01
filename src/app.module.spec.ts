import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from './app.module';
import {ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';

describe('AppModule', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should load ConfigModule and provide ConfigService globally', () => {
    const configService = app.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
    expect(configService).toBeInstanceOf(ConfigService);
  });

  it('should initialize TypeOrmModule successfully', () => {
    const typeOrmModule = app.get(TypeOrmModule);
    expect(typeOrmModule).toBeDefined();
  });
});
