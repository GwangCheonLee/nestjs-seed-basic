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
  let mockPayload: JwtPayloadInterface;
  let mockUser: User;

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

    mockUser = {
      id: 1,
      email: 'test@example.com',
      nickname: 'testuser',
      roles: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockPayload = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        nickname: mockUser.nickname,
        roles: mockUser.roles,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      },
    } as JwtPayloadInterface;
  });

  it('should extract refreshToken from request cookies', () => {
    const jwtFromRequest = (jwtRefreshStrategy as any)._jwtFromRequest;

    const reqWithToken = {cookies: {refreshToken: 'testToken'}} as any;
    const token = jwtFromRequest(reqWithToken);
    expect(token).toBe('testToken');

    const reqWithoutCookies = {} as any;
    const noToken = jwtFromRequest(reqWithoutCookies);
    expect(noToken).toBeNull();

    const reqWithoutToken = {cookies: {}} as any;
    const nullToken = jwtFromRequest(reqWithoutToken);
    expect(nullToken).toBeNull();
  });

  it('should throw UnauthorizedException if refreshToken is missing in cookies', async () => {
    userRepository.findUserById.mockResolvedValue(mockUser);

    await expect(
      jwtRefreshStrategy.validate({cookies: {}} as any, mockPayload),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    userRepository.findUserById.mockResolvedValue({id: 1} as User);

    await expect(
      jwtRefreshStrategy.validate(
        {cookies: {refreshToken: 'mockRefreshToken'}} as any,
        mockPayload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should validate user without concurrent login restriction', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_TOKEN_SECRET') return 'refresh_secret';
      if (key === 'LIMIT_CONCURRENT_LOGIN') return false; // 제한 해제
      return null;
    });

    userRepository.findUserById.mockResolvedValue(mockUser);
    redisService.getUserHashedRefreshToken.mockResolvedValue(
      'hashedRefreshToken',
    );
    (compareWithHash as jest.Mock).mockResolvedValue(true);

    const result = await jwtRefreshStrategy.validate(
      {cookies: {refreshToken: 'refreshToken'}} as any,
      mockPayload,
    );

    expect(result).toEqual(mockUser);
  });

  it('should validate user with correct token when concurrent login is limited', async () => {
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
