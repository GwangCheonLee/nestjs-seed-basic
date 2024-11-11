import {Test, TestingModule} from '@nestjs/testing';
import {RedisService} from './redis.service';
import {RedisRepository} from './redis.repository';
import Redis from 'ioredis-mock';
import {ConfigService} from '@nestjs/config';
import {
  userAccessTokenKey,
  userRefreshTokenKey,
} from './constants/redis-key.constant';
import {hashPlainText} from '../common/constants/encryption.constant';

jest.mock('../common/constants/encryption.constant');

describe('RedisService', () => {
  let service: RedisService;
  let configService: jest.Mocked<ConfigService>;
  let redisClient: typeof Redis;

  beforeAll(async () => {
    redisClient = new Redis();
  });

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_TOKEN_EXPIRATION_TIME') {
          return 3600;
        } else if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_TIME') {
          return 7200;
        }
        return null;
      }),
    } as Partial<ConfigService> as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        RedisRepository,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await redisClient.flushall(); // Clear the Redis database after each test
  });

  afterAll(async () => {
    await redisClient.quit(); // Close the Redis connection after all tests
  });

  describe('setUserAccessToken', () => {
    it('should set the hashed access token in Redis with correct expiration', async () => {
      const userId = 1;
      const accessToken = 'testAccessToken';

      // Mock hashPlainText to return a predictable hash
      const hashedAccessToken = 'hashedTestAccessToken';
      (hashPlainText as jest.Mock).mockResolvedValue(hashedAccessToken);

      await service.setUserAccessToken(userId, accessToken);

      const key = userAccessTokenKey(userId);
      const storedToken = await redisClient.get(key);
      expect(storedToken).toBeDefined();
      expect(storedToken).toEqual(JSON.stringify(hashedAccessToken));

      const ttl = await redisClient.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600);
    });
  });

  describe('getUserHashedAccessToken', () => {
    it('should retrieve the hashed access token from Redis', async () => {
      const userId = 1;
      const hashedAccessToken = 'hashedTestAccessToken';
      const key = userAccessTokenKey(userId);

      await redisClient.set(key, JSON.stringify(hashedAccessToken));

      const result = await service.getUserHashedAccessToken(userId);
      expect(result).toEqual(hashedAccessToken);
    });

    it('should return null if access token does not exist in Redis', async () => {
      const userId = 1;
      const key = userAccessTokenKey(userId);
      await redisClient.del(key);

      const result = await service.getUserHashedAccessToken(userId);
      expect(result).toBeNull();
    });
  });

  describe('setUserRefreshToken', () => {
    it('should set the hashed refresh token in Redis with correct expiration', async () => {
      const userId = 1;
      const refreshToken = 'testRefreshToken';

      const hashedRefreshToken = 'hashedTestRefreshToken';
      (hashPlainText as jest.Mock).mockResolvedValue(hashedRefreshToken);

      await service.setUserRefreshToken(userId, refreshToken);

      const key = userRefreshTokenKey(userId);
      const storedToken = await redisClient.get(key);
      expect(storedToken).toBeDefined();
      expect(storedToken).toEqual(JSON.stringify(hashedRefreshToken));

      const ttl = await redisClient.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(7200);
    });
  });

  describe('getUserHashedRefreshToken', () => {
    it('should retrieve the hashed refresh token from Redis', async () => {
      const userId = 1;
      const hashedRefreshToken = 'hashedTestRefreshToken';
      const key = userRefreshTokenKey(userId);

      await redisClient.set(key, JSON.stringify(hashedRefreshToken));

      const result = await service.getUserHashedRefreshToken(userId);
      expect(result).toEqual(hashedRefreshToken);
    });

    it('should return null if refresh token does not exist in Redis', async () => {
      const userId = 1;
      const key = userRefreshTokenKey(userId);
      await redisClient.del(key);

      const result = await service.getUserHashedRefreshToken(userId);
      expect(result).toBeNull();
    });
  });
});
