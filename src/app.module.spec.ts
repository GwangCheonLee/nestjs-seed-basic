import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from './app.module';
import {ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from './users/entities/user.entity';
import {DataSource} from 'typeorm';
import {setupDataSource} from '../jest/setup';

describe('AppModule', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await setupDataSource();
    moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

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
