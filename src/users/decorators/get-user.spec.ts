import {Test, TestingModule} from '@nestjs/testing';
import {Controller, Get, INestApplication, UseGuards} from '@nestjs/common';
import * as request from 'supertest';
import {User} from '../entities/user.entity';
import {JwtAccessGuard} from '../../authentication/guards/jwt-access.guard';
import {GetUser} from './get-user';

@Controller('test')
class TestController {
  @UseGuards(JwtAccessGuard)
  @Get('user')
  getUser(@GetUser() user: User) {
    return user;
  }
}

describe('GetUser Decorator', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    })
      .overrideGuard(JwtAccessGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            id: 1,
            name: 'Test User',
            email: 'testuser@example.com',
          } as Partial<User> as User;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should retrieve User from request using GetUser decorator', () => {
    return request(app.getHttpServer())
      .get('/test/user')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          id: 1,
          name: 'Test User',
          email: 'testuser@example.com',
        });
      });
  });
});
