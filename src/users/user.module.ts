import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {UserController} from './user.controller';
import {UserService} from './user.service';

/**
 * 사용자 모듈로, 사용자 관련 컨트롤러와 서비스를 관리합니다.
 * @module UserModule
 */
@Module({
  imports: [JwtModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
