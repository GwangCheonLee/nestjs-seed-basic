import {ConflictException, Injectable} from '@nestjs/common';
import {UserRepository} from '../users/repositories/user.repository';
import {hashPlainText} from '../common/constants/encryption.constant';
import {User} from '../users/entities/user.entity';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {getPackageJsonField} from '../common/utils/package-info.util';
import {RedisService} from '../redis/redis.service';
import {extractPayloadFromUser} from '../users/constants/user.constant';
import {UserWithoutPassword} from '../users/types/user.type';

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
    const accessTokenExpirationTime: number = this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );

    const accessToken = this.jwtService.sign(
      {
        user: extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${accessTokenExpirationTime}s`,
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
    const refreshTokenExpirationTime: number = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    const refreshToken = this.jwtService.sign(
      {
        user: extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshTokenExpirationTime}s`,
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

    const user: User = await this.userRepository.signUp(
      signUpRequestBodyDto.email,
      hashedPassword,
      signUpRequestBodyDto.nickname,
    );

    return extractPayloadFromUser(user);
  }

  /**
   * Google 인증된 사용자 정보를 통해 로그인 또는 회원가입을 처리합니다.
   *
   * @param {Partial<User>} user - Google 인증된 사용자 정보
   * @return {Promise<User>} - 인증된 사용자 정보 반환
   */
  async googleSignIn(user: Partial<User>): Promise<User> {
    // 이메일로 기존 회원 확인
    const registeredUser = await this.userRepository.isEmailRegistered(
      user.email,
    );

    if (!registeredUser) {
      // 새 사용자 등록 후 반환
      return this.userRepository.save({
        oauthProvider: user.oauthProvider,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      });
    } else {
      // 기존 사용자 반환
      return this.userRepository.findUserByEmail(user.email);
    }
  }
}
