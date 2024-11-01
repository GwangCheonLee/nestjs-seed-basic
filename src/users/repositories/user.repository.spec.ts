import {DataSource} from 'typeorm';
import {Test, TestingModule} from '@nestjs/testing';
import {UserRepository} from './user.repository';
import {hashPlainText} from '../../common/constants/encryption.constant';
import {UserRole} from '../enum/user-role.enum';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from '../entities/user.entity';
import {setupDataSource} from '../../../jest/setup';
import {NotFoundException, UnauthorizedException} from '@nestjs/common';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await setupDataSource();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserRepository],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  // eslint-disable-next-line require-jsdoc
  const createTestUser = async (
    email: string,
    plainPassword: string,
    nickname: string = 'nickname',
  ) => {
    const hashedPassword = await hashPlainText(plainPassword);
    return userRepository.signUp(email, hashedPassword, nickname);
  };

  describe('User Registration', () => {
    it('should save and return the user', async () => {
      const email = 'test@example.com';
      const nickname = 'nickname';
      const savedUser = await createTestUser(email, 'plainPassword', nickname);

      expect(savedUser).toBeDefined();
      expect(typeof savedUser.id).toBe('number');
      expect(savedUser.oauthProvider).toBe(null);
      expect(savedUser.email).toBe(email);
      expect(typeof savedUser.password).toBe('string');
      expect(savedUser.nickname).toBe(nickname);
      expect(savedUser.profileImage).toBe(null);
      expect(savedUser.roles).toEqual([UserRole.USER]);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Email Registration Check', () => {
    it('should return true if email is already registered', async () => {
      const email = 'registered@example.com';
      await createTestUser(email, 'password');

      const isRegistered = await userRepository.isEmailRegistered(email);
      expect(isRegistered).toBe(true);
    });

    it('should return false if email is not registered', async () => {
      const isRegistered = await userRepository.isEmailRegistered(
        'not_registered@example.com',
      );
      expect(isRegistered).toBe(false);
    });
  });

  describe('User Retrieval by Email', () => {
    it('should find a user by email', async () => {
      const email = 'find@example.com';
      await createTestUser(email, 'password');

      const foundUser = await userRepository.findUserByEmail(email);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(email);
    });

    it('should throw NotFoundException if email is not found', async () => {
      await expect(
        userRepository.findUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('User Credentials Verification', () => {
    it('should verify user credentials', async () => {
      const email = 'verify@example.com';
      const plainPassword = 'password';
      await createTestUser(email, plainPassword);

      const user = await userRepository.verifyUserCredentials(
        email,
        plainPassword,
      );
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const email = 'invalid@example.com';
      await createTestUser(email, 'password');

      await expect(
        userRepository.verifyUserCredentials(email, 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('User Retrieval by ID', () => {
    it('should find a user by ID', async () => {
      const email = 'id@example.com';
      const savedUser = await createTestUser(email, 'password');

      const foundUser = await userRepository.findUserById(savedUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(savedUser.id);
    });

    it('should throw NotFoundException if ID is not found', async () => {
      await expect(userRepository.findUserById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Two-Factor Authentication Secret', () => {
    it('should set two-factor authentication secret', async () => {
      const email = '2fa@example.com';
      const savedUser = await createTestUser(email, 'password');

      const secret = 'my-secret';
      const result = await userRepository.setTwoFactorAuthenticationSecret(
        secret,
        savedUser.id,
      );

      expect(result.affected).toBe(1);
      const updatedUser = await userRepository.findUserById(savedUser.id);
      expect(updatedUser.twoFactorAuthenticationSecret).toBe(secret);
    });
  });
});
