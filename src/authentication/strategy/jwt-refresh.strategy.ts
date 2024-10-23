import {Strategy} from 'passport-jwt';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ConfigService} from '@nestjs/config';
import {GuardEnum} from '../enum/guard.enum';
import {UserRepository} from '../../users/repositories/user.repository';
import {JwtPayloadInterface} from '../interfaces/jwt-payload.interface';
import {User} from '../../users/entities/user.entity';
import {compareWithHash} from '../../common/constants/encryption.constant';
import {RedisService} from '../../redis/redis.service';
import {Request} from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  GuardEnum.JWT_REFRESH,
) {
  private readonly limitConcurrentLogin: boolean;

  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req.cookies && req.cookies.refreshToken) {
          return req.cookies.refreshToken;
        }
        return null;
      },
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });

    this.limitConcurrentLogin = configService.get<boolean>(
      'LIMIT_CONCURRENT_LOGIN',
    );
  }

  /**
   * JWT 리프레시 토큰을 검증하는 메서드입니다.
   *
   * @param {Request} req - Request 객체
   * @param {JwtPayloadInterface} payload - JWT 페이로드
   * @return {Promise<User>} - 검증된 유저 정보를 반환
   * @throws {UnauthorizedException} - 토큰이 유효하지 않으면 예외를 발생
   */
  async validate(req: Request, payload: JwtPayloadInterface): Promise<User> {
    const user: User = await this.userRepository.findUserById(payload.user.id);

    if (this.limitConcurrentLogin) {
      const hashedUserRefreshTokenByRedis: string | null =
        await this.redisService.getUserHashedRefreshToken(user.id);

      if (!hashedUserRefreshTokenByRedis) {
        throw new UnauthorizedException('Token mismatch.');
      }

      const userTokenByRequest = req.cookies.refreshToken;
      const isValidate = await compareWithHash(
        userTokenByRequest,
        hashedUserRefreshTokenByRedis,
      );

      if (!isValidate) {
        throw new UnauthorizedException('Token mismatch.');
      }
    }

    return user;
  }
}
