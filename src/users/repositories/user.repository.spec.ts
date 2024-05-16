import { UserRepository } from './user.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

const mockDataSource = {
  createEntityManager: jest.fn(),
};

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  describe('signUp', () => {
    it('should save and return the user', async () => {
      const user = {
        email: 'email',
        password: 'hashedPassword',
        nickname: 'nickname',
      };

      jest.spyOn(userRepository, 'save').mockResolvedValue(user as User);

      const result = await userRepository.signUp(
        'email',
        'hashedPassword',
        'nickname',
      );
      expect(result).toEqual(user);
    });
  });

  describe('isEmailRegistered', () => {
    it('should return true if email is registered', async () => {
      const user = { email: 'email' };

      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user as User),
      } as any);

      const result = await userRepository.isEmailRegistered('email');
      expect(result).toBe(true);
    });

    it('should return false if email is not registered', async () => {
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await userRepository.isEmailRegistered('email');
      expect(result).toBe(false);
    });
  });
});
