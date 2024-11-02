import {Test, TestingModule} from '@nestjs/testing';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {JwtAccessGuard} from '../authentication/guards/jwt-access.guard';
import {VerifyUserOwnershipGuard} from './guards/verify-user-ownership.guard';
import {UserPaginatedDto} from './dto/user-paginated.dto';
import {NotFoundException} from '@nestjs/common';
import {User} from './entities/user.entity';
import {UserRole} from './enum/user-role.enum';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            paginateUsers: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            findByUserForTwoFactorEnabled: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAccessGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .overrideGuard(VerifyUserOwnershipGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const paginatedUsers = {
        users: [
          {
            id: 1,
            email: 'test@example.com',
            nickname: 'testUser',
            roles: [UserRole.USER],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {totalEntry: 1, page: 1, limit: 10},
      };
      jest
        .spyOn(userService, 'paginateUsers')
        .mockResolvedValue(paginatedUsers);

      const result = await userController.getUsers({
        page: 1,
        limit: 10,
      } as UserPaginatedDto);

      expect(result).toEqual(paginatedUsers);
      expect(userService.paginateUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const mockUser = {id: 1, email: 'test@example.com'} as User;
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      const result = await userController.getUser(1);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(null);

      await expect(userController.getUser(-1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const updateUserDto = {email: 'new@example.com', nickname: 'New Nick'};
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        nickname: 'New Nick',
      } as User;

      jest.spyOn(userService, 'updateUser').mockResolvedValue(mockUser);

      const result = await userController.updateUser(
        1,
        mockUser,
        updateUserDto,
      );

      expect(result).toEqual(mockUser);
      expect(userService.updateUser).toHaveBeenCalledWith(
        1,
        updateUserDto,
        mockUser,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by id', async () => {
      jest.spyOn(userService, 'deleteUser').mockResolvedValue(undefined);

      await expect(userController.deleteUser(1)).resolves.toBeUndefined();
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe('isTwoFactorEnabled', () => {
    it('should return true if two-factor is enabled', async () => {
      const mockUser = {id: 1, twoFactorAuthenticationSecret: 'secret'} as User;
      jest
        .spyOn(userService, 'findByUserForTwoFactorEnabled')
        .mockResolvedValue(mockUser);

      const result = await userController.isTwoFactorEnabled(1);

      expect(result).toBe(true);
    });

    it('should return false if two-factor is not enabled', async () => {
      const mockUser = {id: 1, twoFactorAuthenticationSecret: null} as User;
      jest
        .spyOn(userService, 'findByUserForTwoFactorEnabled')
        .mockResolvedValue(mockUser);

      const result = await userController.isTwoFactorEnabled(1);

      expect(result).toBe(false);
    });
  });
});
