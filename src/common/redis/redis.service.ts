import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {RedisRepository} from './redis.repository';
import {hashPlainText} from '../constants/encryption.constant';
import {
  userAccessTokenKey,
  userRefreshTokenKey,
} from './constants/redis-key.constant';

@Injectable()
export class RedisService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisRepository: RedisRepository,
  ) {}

  /**
   * 유저의 accessToken을 Redis에서 가져옵니다.
   * @param {number} userId - 토큰을 가져올 유저의 아이디
   * @return {Promise<string>} - 유저의 hashed accessToken
   */
  getUserHashedAccessToken(userId: number): Promise<string | null> {
    return this.redisRepository.get(userAccessTokenKey(userId));
  }

  /**
   * 유저의 refreshToken을 Redis에서 가져옵니다.
   * @param {number} userId - 토큰을 가져올 유저의 아이디
   * @return {Promise<string>} - 유저의 hashed refreshToken
   */
  getUserHashedRefreshToken(userId: number): Promise<string | null> {
    return this.redisRepository.get(userRefreshTokenKey(userId));
  }

  /**
   * 유저의 accessToken을  Redis에 저장합니다.
   *
   * @param {number} userId - 토큰을 저장할 유저의 아이디
   * @param {string} accessToken - 토큰
   * @return {Promise<void>} - 데이터 저장이 완료되면 반환되는 Promise
   */
  async setUserAccessToken(userId: number, accessToken: string): Promise<void> {
    const accessTokenExpirationTime: string = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );

    const hashedAccessToken = await hashPlainText(accessToken);
    await this.redisRepository.set(
      userAccessTokenKey(userId),
      hashedAccessToken,
      Number(accessTokenExpirationTime) * 60,
    );
  }

  /**
   * 유저의 refreshToken을  Redis에 저장합니다.
   *
   * @param {number} userId - 토큰을 저장할 유저의 아이디
   * @param {string} refreshToken - 토큰
   * @return {Promise<void>} - 데이터 저장이 완료되면 반환되는 Promise
   */
  async setUserRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenExpirationTime: string = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    const hashedAccessToken = await hashPlainText(refreshToken);
    await this.redisRepository.set(
      userRefreshTokenKey(userId),
      hashedAccessToken,
      Number(refreshTokenExpirationTime) * 60 * 60 * 24,
    );
  }
}
