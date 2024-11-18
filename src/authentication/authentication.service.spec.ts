import {Test, TestingModule} from '@nestjs/testing';
import {AuthenticationService} from './authentication.service';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {UserRepository} from '../users/repositories/user.repository';
import {RedisService} from '../redis/redis.service';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {ConflictException} from '@nestjs/common';
import {User} from '../users/entities/user.entity';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: jest.Mocked<UserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    userRepository = {
      isEmailRegistered: jest.fn(),
      signUp: jest.fn(),
      setTwoFactorAuthenticationSecret: jest.fn(),
      findUserByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    redisService = {
      setUserAccessToken: jest.fn(),
      setUserRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {provide: UserRepository, useValue: userRepository},
        {provide: RedisService, useValue: redisService},
        {provide: ConfigService, useValue: configService},
        {provide: JwtService, useValue: jwtService},
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  describe('signUp', () => {
    it('should throw ConflictException if email is already registered', async () => {
      userRepository.isEmailRegistered.mockResolvedValueOnce(true);

      const signUpDto: SignUpRequestBodyDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testUser',
      };

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );

      expect(userRepository.isEmailRegistered).toHaveBeenCalledWith(
        signUpDto.email,
      );
    });

    it('should create a new user and return the payload without a password', async () => {
      userRepository.isEmailRegistered.mockResolvedValueOnce(false);
      userRepository.signUp.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        nickname: 'testUser',
        password: 'hashedPassword',
      } as User);

      const signUpDto: SignUpRequestBodyDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testUser',
      };

      const result = await service.signUp(signUpDto);

      expect(userRepository.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        expect.any(String),
        signUpDto.nickname,
      );

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        nickname: 'testUser',
      });
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token and store it in Redis if limitConcurrentLogin is enabled', async () => {
      configService.get.mockReturnValueOnce(3600).mockReturnValueOnce(true);
      jwtService.sign.mockReturnValueOnce('mockAccessToken');
      redisService.setUserAccessToken.mockResolvedValueOnce(undefined);

      const user = {id: 1, email: 'test@example.com'} as User;

      const result = await service.generateAccessToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          user: {id: 1, email: 'test@example.com'},
          sub: 1,
        },
        {
          secret: true,
          expiresIn: '3600s',
          issuer: 'nestjs-seed',
          audience: 'test@example.com',
          algorithm: 'HS256',
        },
      );

      expect(result).toBe('mockAccessToken');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and store it in Redis if limitConcurrentLogin is enabled', async () => {
      configService.get.mockReturnValueOnce(7200).mockReturnValueOnce(true);
      jwtService.sign.mockReturnValueOnce('mockRefreshToken');
      redisService.setUserRefreshToken.mockResolvedValueOnce(undefined);

      const user = {id: 1, email: 'test@example.com'} as User;

      const result = await service.generateRefreshToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          user: expect.any(Object),
          sub: user.id,
        },
        {
          secret: true,
          expiresIn: '7200s',
          issuer: expect.any(String),
          audience: user.email,
          algorithm: 'HS256',
        },
      );

      expect(result).toBe('mockRefreshToken');
    });
  });
});
