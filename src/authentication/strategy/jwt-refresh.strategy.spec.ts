import {Test, TestingModule} from '@nestjs/testing';
import {JwtRefreshStrategy} from './jwt-refresh.strategy';
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

describe('JwtRefreshStrategy', () => {
  let jwtRefreshStrategy: JwtRefreshStrategy;
  let userRepository: jest.Mocked<UserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getUserHashedRefreshToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_REFRESH_TOKEN_SECRET') return 'refresh_secret';
              if (key === 'LIMIT_CONCURRENT_LOGIN') return true;
              return null;
            }),
          },
        },
      ],
    }).compile();

    jwtRefreshStrategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
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
      user: {
        id: mockUser.id,
        email: '',
        nickname: '',
        roles: [],
        isActive: false,
        createdAt: undefined,
        updatedAt: undefined,
      },
    } as JwtPayloadInterface;

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedRefreshToken.mockResolvedValue(
      Promise.resolve('Redis Token'),
    );
    (compareWithHash as jest.Mock).mockResolvedValue(true);

    const result = await jwtRefreshStrategy.validate(
      {cookies: {refreshToken: 'refreshToken'}} as any,
      mockPayload,
    );

    expect(result).toEqual(mockUser);
  });

  it('should validate user with correct token when concurrent login is limited', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {
        id: mockUser.id,
        email: '',
        nickname: '',
        roles: [],
        isActive: false,
        createdAt: undefined,
        updatedAt: undefined,
      },
    } as JwtPayloadInterface;
    const mockRefreshToken = 'mockRefreshToken';
    const hashedToken = 'hashedRefreshToken';

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedRefreshToken.mockResolvedValue(hashedToken);
    (compareWithHash as jest.Mock).mockResolvedValue(true);

    const mockRequest = {cookies: {refreshToken: mockRefreshToken}} as any;

    const result = await jwtRefreshStrategy.validate(mockRequest, mockPayload);

    expect(result).toEqual(mockUser);
    expect(redisService.getUserHashedRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
    );
    expect(compareWithHash).toHaveBeenCalledWith(mockRefreshToken, hashedToken);
  });

  it('should throw UnauthorizedException if token is missing in Redis', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {
        id: mockUser.id,
        email: '',
        nickname: '',
        roles: [],
        isActive: false,
        createdAt: undefined,
        updatedAt: undefined,
      },
    } as JwtPayloadInterface;

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedRefreshToken.mockResolvedValue(null);

    await expect(
      jwtRefreshStrategy.validate(
        {cookies: {refreshToken: 'mockRefreshToken'}} as any,
        mockPayload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token hash comparison fails', async () => {
    const mockUser = {id: 1, email: 'test@example.com'} as User;
    const mockPayload: JwtPayloadInterface = {
      user: {
        id: mockUser.id,
        email: '',
        nickname: '',
        roles: [],
        isActive: false,
        createdAt: undefined,
        updatedAt: undefined,
      },
    } as JwtPayloadInterface;
    const mockRefreshToken = 'mockRefreshToken';
    const hashedToken = 'hashedRefreshToken';

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedRefreshToken.mockResolvedValue(hashedToken);
    (compareWithHash as jest.Mock).mockResolvedValue(false);

    const mockRequest = {cookies: {refreshToken: mockRefreshToken}} as any;

    await expect(
      jwtRefreshStrategy.validate(mockRequest, mockPayload),
    ).rejects.toThrow(UnauthorizedException);
  });
});
