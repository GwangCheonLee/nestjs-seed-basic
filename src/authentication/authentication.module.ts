import {Module} from '@nestjs/common';
import {AuthenticationService} from './authentication.service';
import {AuthenticationController} from './authentication.controller';
import {LocalStrategy} from './strategy/local.strategy';
import {UserRepository} from '../users/repositories/user.repository';
import {JwtModule} from '@nestjs/jwt';
import {JwtAccessStrategy} from './strategy/jwt-access.strategy';
import {JwtRefreshStrategy} from './strategy/jwt-refresh.strategy';
import {GoogleStrategy} from './strategy/google.strategy';

/**
 * Authentication 모듈은 사용자 인증과 관련된 모든 기능을 담당하는 모듈입니다.
 * 이 모듈은 로그인, 회원가입, 액세스 토큰 및 리프레시 토큰 발급을 포함한
 * 인증 로직을 처리합니다.
 */
@Module({
  imports: [JwtModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    UserRepository,
  ],
})
export class AuthenticationModule {}
