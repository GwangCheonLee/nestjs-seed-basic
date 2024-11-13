import {Test, TestingModule} from '@nestjs/testing';
import {LocalStrategy} from './local.strategy';
import {UserRepository} from '../../users/repositories/user.repository';
import {User} from '../../users/entities/user.entity';
import {authenticator} from 'otplib';
import {UnauthorizedException} from '@nestjs/common';

jest.mock('otplib', () => ({
  authenticator: {
    verify: jest.fn(),
  },
}));

describe('LocalStrategy', () => {
  let localStrategy: LocalStrategy;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: UserRepository,
          useValue: {
            verifyUserCredentials: jest.fn(),
          },
        },
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    userRepository = module.get<UserRepository>(
      UserRepository,
    ) as jest.Mocked<UserRepository>;
  });

  it('should validate user credentials without 2FA', async () => {
    const mockUser = {email: 'test@example.com', password: 'password'} as User;
    userRepository.verifyUserCredentials.mockResolvedValue(mockUser);

    const result = await localStrategy.validate(
      {body: {}} as any, // Mocked request object without 2FA code
      'test@example.com',
      'password',
    );

    expect(result).toEqual(mockUser);
  });

  it('should validate user credentials with correct 2FA code', async () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'password',
      twoFactorAuthenticationSecret: 'secret',
    } as User;

    userRepository.verifyUserCredentials.mockResolvedValue(mockUser);
    (authenticator.verify as jest.Mock).mockReturnValue(true);

    const result = await localStrategy.validate(
      {body: {twoFactorAuthenticationCode: '123456'}} as any, // Mocked request with 2FA code
      'test@example.com',
      'password',
    );

    expect(result).toEqual(mockUser);
    expect(authenticator.verify).toHaveBeenCalledWith({
      token: '123456',
      secret: 'secret',
    });
  });

  it('should throw an UnauthorizedException if 2FA code is missing', async () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'password',
      twoFactorAuthenticationSecret: 'secret',
    } as User;

    userRepository.verifyUserCredentials.mockResolvedValue(mockUser);

    await expect(
      localStrategy.validate(
        {body: {}} as any, // No 2FA code
        'test@example.com',
        'password',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw an UnauthorizedException if 2FA code is invalid', async () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'password',
      twoFactorAuthenticationSecret: 'secret',
    } as User;

    userRepository.verifyUserCredentials.mockResolvedValue(mockUser);
    (authenticator.verify as jest.Mock).mockReturnValue(false); // Invalid code

    await expect(
      localStrategy.validate(
        {body: {twoFactorAuthenticationCode: 'invalid'}} as any,
        'test@example.com',
        'password',
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(authenticator.verify).toHaveBeenCalledWith({
      token: 'invalid',
      secret: 'secret',
    });
  });
});
