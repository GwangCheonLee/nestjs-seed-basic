import {ConflictException, Injectable} from '@nestjs/common';
import {UserRepository} from '../users/repositories/user.repository';
import {hashPlainText} from '../common/constants/encryption.constant';
import {User} from '../users/entities/user.entity';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {getPackageJsonField} from '../common/utils/package-info.util';
import {RedisService} from '../common/redis/redis.service';
import {UserWithoutPassword} from '../users/interfaces/user.interface';
import {extractPayloadFromUser} from '../users/constants/user.constant';

@Injectable()
export class AuthenticationService {
  private readonly limitConcurrentLogin: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {
    this.limitConcurrentLogin = configService.get<boolean>(
      'LIMIT_CONCURRENT_LOGIN',
    );
  }

  /**
   * 유저의 accessToken을 생성하고 Redis에 저장합니다.
   *
   * @param {User} user - 토큰을 생성할 유저
   * @return {Promise<string>} - 생성된 accessToken
   */
  async generateAccessToken(user: User): Promise<string> {
    const accessTokenExpirationTime: string = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );

    const accessToken = this.jwtService.sign(
      {
        user: extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${accessTokenExpirationTime}m`,
        issuer: getPackageJsonField('name'),
        audience: user.email,
        algorithm: 'HS256',
      },
    );

    if (this.limitConcurrentLogin) {
      await this.redisService.setUserAccessToken(user.id, accessToken);
    }

    return accessToken;
  }

  /**
   * 유저의 refreshToken을 생성하고 Redis에 저장합니다.
   *
   * @param {User} user - 토큰을 생성할 유저
   * @return {Promise<string>} - 생성된 refreshToken
   */
  async generateRefreshToken(user: User): Promise<string> {
    const refreshTokenExpirationTime: string = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    const refreshToken = this.jwtService.sign(
      {
        user: extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshTokenExpirationTime}d`,
        issuer: getPackageJsonField('name'),
        audience: user.email,
        algorithm: 'HS256',
      },
    );

    if (this.limitConcurrentLogin) {
      await this.redisService.setUserRefreshToken(user.id, refreshToken);
    }

    return refreshToken;
  }

  /**
   * 회원 가입 로직.
   *
   * @param {SignUpRequestBodyDto} signUpRequestBodyDto - 회원 가입 요청 데이터
   * @return {Promise<UserWithoutPassword>} - 회원 가입 후 인증된 사용자 데이터
   */
  async signUp(
    signUpRequestBodyDto: SignUpRequestBodyDto,
  ): Promise<UserWithoutPassword> {
    const emailExists = await this.userRepository.isEmailRegistered(
      signUpRequestBodyDto.email,
    );

    if (emailExists) {
      throw new ConflictException(
        'This email is already registered. Please use another email.',
      );
    }

    const hashedPassword = await hashPlainText(signUpRequestBodyDto.password);

    const user = await this.userRepository.signUp(
      signUpRequestBodyDto.email,
      hashedPassword,
      signUpRequestBodyDto.nickname,
    );

    return extractPayloadFromUser(user);
  }

  /**
   * 로그인 로직으로 accessToken과 refreshToken을 생성하고 반환합니다.
   *
   * @param {User} user - Local 가드를 통과한 유저
   * @return {Promise<Object>} - 액세스 토큰과 리프레시 토큰이 포함된 객체
   * @return {Promise<string>} returns.accessToken - 생성된 액세스 토큰
   * @return {Promise<string>} returns.refreshToken - 생성된 리프레시 토큰
   */
  async signIn(
    user: User,
  ): Promise<{accessToken: string; refreshToken: string}> {
    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user),
    };
  }
}
