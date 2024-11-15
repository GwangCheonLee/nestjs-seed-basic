import {Test, TestingModule} from '@nestjs/testing';
import {JwtAccessStrategy} from './jwt-access.strategy';
import {UserRepository} from '../../users/repositories/user.repository';
import {ConfigService} from '@nestjs/config';
import {RedisService} from '../../redis/redis.service';
import {UnauthorizedException} from '@nestjs/common';
import {JwtPayloadInterface} from '../interfaces/jwt-payload.interface';
import {User} from '../../users/entities/user.entity';
import {compareWithHash} from '../../common/constants/encryption.constant';

jest.mock('../../common/constants/encryption.constant', () => ({
  compareWithHash: jest.fn(),
}));

describe('JwtAccessStrategy', () => {
  let jwtAccessStrategy: JwtAccessStrategy;
  let userRepository: jest.Mocked<UserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessStrategy,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getUserHashedAccessToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_TOKEN_SECRET') return 'secret';
              if (key === 'LIMIT_CONCURRENT_LOGIN') return true;
              return null;
            }),
          },
        },
      ],
    }).compile();

    jwtAccessStrategy = module.get<JwtAccessStrategy>(JwtAccessStrategy);
    userRepository = module.get<UserRepository>(
      UserRepository,
    ) as jest.Mocked<UserRepository>;
    redisService = module.get<RedisService>(
      RedisService,
    ) as jest.Mocked<RedisService>;
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;
  });

  it('should validate user without concurrent login restriction', async () => {
    configService.get.mockImplementationOnce((key: string) => false);

    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {id: mockUser.id},
    } as JwtPayloadInterface;

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedAccessToken.mockResolvedValue(
      Promise.resolve('Redis Token'),
    );
    (compareWithHash as jest.Mock).mockResolvedValue(true);

    const result = await jwtAccessStrategy.validate(
      {headers: {authorization: 'Token'}} as any,
      mockPayload,
    );

    expect(result).toEqual(mockUser);
  });

  it('should validate user with correct token when concurrent login is limited', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {id: mockUser.id},
    } as JwtPayloadInterface;
    const mockAccessToken = 'mockAccessToken';
    const hashedToken = 'hashedAccessToken';

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedAccessToken.mockResolvedValue(hashedToken);
    (compareWithHash as jest.Mock).mockResolvedValue(true);

    const mockRequest = {
      headers: {authorization: `Bearer ${mockAccessToken}`},
    } as any;

    const result = await jwtAccessStrategy.validate(mockRequest, mockPayload);

    expect(result).toEqual(mockUser);
    expect(redisService.getUserHashedAccessToken).toHaveBeenCalledWith(
      mockUser.id,
    );
    expect(compareWithHash).toHaveBeenCalledWith(mockAccessToken, hashedToken);
  });

  it('should throw UnauthorizedException if token is missing in Redis', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {id: mockUser.id},
    } as JwtPayloadInterface;
    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedAccessToken.mockResolvedValue(null); // Token not in Redis

    await expect(
      jwtAccessStrategy.validate(
        {headers: {authorization: 'Bearer mockToken'}} as any,
        mockPayload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token hash comparison fails', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {id: mockUser.id},
    } as JwtPayloadInterface;
    const mockAccessToken = 'mockAccessToken';
    const hashedToken = 'hashedAccessToken';

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedAccessToken.mockResolvedValue(hashedToken);
    (compareWithHash as jest.Mock).mockResolvedValue(false); // Invalid token hash

    const mockRequest = {
      headers: {authorization: `Bearer ${mockAccessToken}`},
    } as any;

    await expect(
      jwtAccessStrategy.validate(mockRequest, mockPayload),
    ).rejects.toThrow(UnauthorizedException);
  });
});
