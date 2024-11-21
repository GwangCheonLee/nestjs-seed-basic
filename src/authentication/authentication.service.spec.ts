import {Test, TestingModule} from '@nestjs/testing';
import {AuthenticationService} from './authentication.service';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {UserRepository} from '../users/repositories/user.repository';
import {RedisService} from '../redis/redis.service';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {ConflictException} from '@nestjs/common';
import {User} from '../users/entities/user.entity';
import {hashPlainText} from '../common/constants/encryption.constant';
import {getPackageJsonField} from '../common/utils/package-info.util';
import {extractPayloadFromUser} from '../users/constants/user.constant';
import {Response} from 'express';
import {authenticator} from 'otplib';
import {toFileStream} from 'qrcode';

jest.mock('../common/constants/encryption.constant');
jest.mock('../common/utils/package-info.util');
jest.mock('../users/constants/user.constant');
jest.mock('otplib');
jest.mock('qrcode');

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
    } as Partial<UserRepository> as jest.Mocked<UserRepository>;

    redisService = {
      setUserAccessToken: jest.fn(),
      setUserRefreshToken: jest.fn(),
    } as Partial<RedisService> as jest.Mocked<RedisService>;

    configService = {
      get: jest.fn(),
    } as Partial<ConfigService> as jest.Mocked<ConfigService>;

    jwtService = {
      sign: jest.fn(),
    } as Partial<JwtService> as jest.Mocked<JwtService>;

    (getPackageJsonField as jest.Mock).mockReturnValue('test-app');
    (hashPlainText as jest.Mock).mockImplementation(
      async (text: string) => `hashed-${text}`,
    );
    (extractPayloadFromUser as jest.Mock).mockImplementation((user: User) => {
      const {password, ...payload} = user;
      return payload;
    });

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

      const savedUser: User = {
        id: 1,
        email: 'test@example.com',
        nickname: 'testUser',
        password: 'hashed-password123',
      } as User;

      userRepository.signUp.mockResolvedValueOnce(savedUser);

      const signUpDto: SignUpRequestBodyDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testUser',
      };

      const result = await service.signUp(signUpDto);

      expect(userRepository.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        'hashed-password123',
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
      (service as any).limitConcurrentLogin = true;
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRATION_TIME':
            return 3600;
          case 'JWT_ACCESS_TOKEN_SECRET':
            return 'access-secret';
          case 'LIMIT_CONCURRENT_LOGIN':
            return true;
          default:
            return null;
        }
      });

      jwtService.sign.mockReturnValueOnce('mockAccessToken');
      redisService.setUserAccessToken.mockResolvedValueOnce(undefined);

      const user = {id: 1, email: 'test@example.com'} as User;
      (extractPayloadFromUser as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.generateAccessToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          user: {id: 1, email: 'test@example.com'},
          sub: 1,
        },
        {
          secret: 'access-secret',
          expiresIn: '3600s',
          issuer: 'test-app',
          audience: 'test@example.com',
          algorithm: 'HS256',
        },
      );

      expect(redisService.setUserAccessToken).toHaveBeenCalledWith(
        1,
        'mockAccessToken',
      );
      expect(result).toBe('mockAccessToken');
    });

    it('should generate an access token without storing in Redis if limitConcurrentLogin is disabled', async () => {
      jwtService.sign.mockReturnValueOnce('mockAccessToken');

      const user = {id: 1, email: 'test@example.com'} as User;
      (extractPayloadFromUser as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.generateAccessToken(user);

      expect(redisService.setUserAccessToken).not.toHaveBeenCalled();
      expect(result).toBe('mockAccessToken');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and store it in Redis if limitConcurrentLogin is enabled', async () => {
      (service as any).limitConcurrentLogin = true;
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
            return 7200;
          case 'JWT_REFRESH_TOKEN_SECRET':
            return 'refresh-secret';
          case 'LIMIT_CONCURRENT_LOGIN':
            return true;
          default:
            return null;
        }
      });

      jwtService.sign.mockReturnValueOnce('mockRefreshToken');
      redisService.setUserRefreshToken.mockResolvedValueOnce(undefined);

      const user = {id: 1, email: 'test@example.com'} as User;
      (extractPayloadFromUser as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.generateRefreshToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          user: {id: 1, email: 'test@example.com'},
          sub: 1,
        },
        {
          secret: 'refresh-secret',
          expiresIn: '7200s',
          issuer: 'test-app',
          audience: 'test@example.com',
          algorithm: 'HS256',
        },
      );

      expect(redisService.setUserRefreshToken).toHaveBeenCalledWith(
        1,
        'mockRefreshToken',
      );
      expect(result).toBe('mockRefreshToken');
    });

    it('should generate a refresh token without storing in Redis if limitConcurrentLogin is disabled', async () => {
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
            return 7200;
          case 'JWT_REFRESH_TOKEN_SECRET':
            return 'refresh-secret';
          case 'LIMIT_CONCURRENT_LOGIN':
            return false;
          default:
            return null;
        }
      });

      jwtService.sign.mockReturnValueOnce('mockRefreshToken');

      const user = {id: 1, email: 'test@example.com'} as User;
      (extractPayloadFromUser as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.generateRefreshToken(user);

      expect(redisService.setUserRefreshToken).not.toHaveBeenCalled();
      expect(result).toBe('mockRefreshToken');
    });
  });

  describe('googleSignIn', () => {
    it('should register a new user if email is not registered', async () => {
      userRepository.isEmailRegistered.mockResolvedValueOnce(false);

      const userData: Partial<User> = {
        email: 'google@example.com',
        nickname: 'GoogleUser',
        oauthProvider: 'google',
        profileImage: 'http://example.com/image.jpg',
      };

      userRepository.save.mockResolvedValueOnce(userData as User);

      const result = await service.googleSignIn(userData);

      expect(userRepository.isEmailRegistered).toHaveBeenCalledWith(
        'google@example.com',
      );
      expect(userRepository.save).toHaveBeenCalledWith(userData);
      expect(result).toEqual(userData);
    });

    it('should return existing user if email is already registered', async () => {
      userRepository.isEmailRegistered.mockResolvedValueOnce(true);
      userRepository.findUserByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'google@example.com',
      } as User);

      const userData: Partial<User> = {
        email: 'google@example.com',
        nickname: 'GoogleUser',
        oauthProvider: 'google',
        profileImage: 'http://example.com/image.jpg',
      };

      const result = await service.googleSignIn(userData);

      expect(userRepository.isEmailRegistered).toHaveBeenCalledWith(
        'google@example.com',
      );
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        'google@example.com',
      );
      expect(result).toEqual({id: 1, email: 'google@example.com'});
    });
  });

  describe('generateTwoFactorAuthenticationSecret', () => {
    it('should generate 2FA secret and otpauthUrl, and save the secret for the user', async () => {
      configService.get.mockReturnValue('TestApp');
      const user: User = {id: 1, email: 'user@example.com'} as User;

      (authenticator.generateSecret as jest.Mock).mockReturnValue('secret');
      (authenticator.keyuri as jest.Mock).mockReturnValue(
        'otpauth://totp/TestApp:user@example.com?secret=secret',
      );

      await service.generateTwoFactorAuthenticationSecret(user);

      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        'user@example.com',
        'TestApp',
        'secret',
      );
      expect(
        userRepository.setTwoFactorAuthenticationSecret,
      ).toHaveBeenCalledWith('secret', 1);
    });
  });

  describe('pipeQrCodeStream', () => {
    it('should pipe QR code stream to response', async () => {
      const stream = {} as Response;
      const otpauthUrl =
        'otpauth://totp/TestApp:user@example.com?secret=secret';

      (toFileStream as jest.Mock).mockResolvedValueOnce(undefined);

      await service.pipeQrCodeStream(stream, otpauthUrl);

      expect(toFileStream).toHaveBeenCalledWith(stream, otpauthUrl);
    });
  });
});
