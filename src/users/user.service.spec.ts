import {UserPaginatedDto} from './dto/user-paginated.dto';
import {DataSource} from 'typeorm';
import {UserService} from './user.service';
import {UserRepository} from './repositories/user.repository';
import {setupDataSource} from '../../jest/setup';
import {Test, TestingModule} from '@nestjs/testing';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import {UserRole} from './enum/user-role.enum';
import {UpdateUserDto} from './dto/update-user.dto';
import {ConflictException, ForbiddenException} from '@nestjs/common';
import {compareWithHash} from '../common/constants/encryption.constant';

describe('UserService with pg-mem', () => {
  let dataSource: DataSource;
  let userService: UserService;
  let userRepository: UserRepository;

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
      providers: [UserService, UserRepository],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  const createTestUser = async (
    email: string,
    nickname: string,
    roles: UserRole[] = [UserRole.USER],
  ) => {
    return await userRepository.save({
      email,
      password: 'password',
      nickname,
      roles,
    });
  };

  describe('paginateUsers', () => {
    beforeEach(async () => {
      await createTestUser('user1@example.com', 'User One');
      await createTestUser('user2@example.com', 'User Two');
      await createTestUser('user3@example.com', 'User Three');
    });

    it('should paginate users with default options', async () => {
      const userPaginatedDto: UserPaginatedDto = {
        page: 1,
        limit: 2,
        sort: 'ASC',
        sortBy: 'nickname',
      };

      const result = await userService.paginateUsers(userPaginatedDto);

      expect(result).toBeDefined();
      expect(result.users.length).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalEntry).toBe(3);
    });

    it('should paginate and sort users in ascending order by nickname', async () => {
      const userPaginatedDto: UserPaginatedDto = {
        page: 1,
        limit: 2,
        sort: 'ASC',
        sortBy: 'nickname',
      };

      const result = await userService.paginateUsers(userPaginatedDto);

      expect(result).toBeDefined();
      expect(result.users.length).toBe(2);
      expect(result.users[0].nickname).toBe('User One');
      expect(result.users[1].nickname).toBe('User Three');
    });

    it('should paginate and sort users in descending order by email', async () => {
      const userPaginatedDto: UserPaginatedDto = {
        page: 1,
        limit: 2,
        sort: 'DESC',
        sortBy: 'email',
      };

      const result = await userService.paginateUsers(userPaginatedDto);

      expect(result).toBeDefined();
      expect(result.users.length).toBe(2);
      expect(result.users[0].email).toBe('user3@example.com');
      expect(result.users[1].email).toBe('user2@example.com');
    });

    it('should return correct pagination details', async () => {
      const userPaginatedDto: UserPaginatedDto = {
        page: 2,
        limit: 1,
        sort: 'ASC',
        sortBy: 'createdAt',
      };

      const result = await userService.paginateUsers(userPaginatedDto);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.totalEntry).toBe(3);
      expect(result.users[0].nickname).toBe('User Two');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const result = await userService.getUserById(user.id);

      expect(result).toBeDefined();
      expect(result.email).toBe('testUser@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update user details successfully', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const updateUserDto: UpdateUserDto = {nickname: 'Updated User'};

      const updatedUser = await userService.updateUser(
        user.id,
        updateUserDto,
        user,
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.nickname).toBe('Updated User');
    });

    it('should throw ForbiddenException when non-admin tries to change email', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const nonAdminUser = {...user, roles: [UserRole.USER]} as User;
      const updateUserDto: UpdateUserDto = {email: 'newemail@example.com'};

      await expect(
        userService.updateUser(user.id, updateUserDto, nonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if the new email is already registered', async () => {
      await createTestUser('existing@example.com', 'Existing User');
      const user = await createTestUser('testUser@example.com', 'Test User', [
        UserRole.ADMIN,
      ]);
      const updateUserDto: UpdateUserDto = {email: 'existing@example.com'};

      await expect(
        userService.updateUser(user.id, updateUserDto, user),
      ).rejects.toThrow(ConflictException);
    });

    it('should update the password successfully', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const updateUserDto: UpdateUserDto = {password: 'newpassword'};

      const updatedUser = await userService.updateUser(
        user.id,
        updateUserDto,
        user,
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.password).not.toBe(user.password);

      const isPasswordMatch = await compareWithHash(
        'newpassword',
        updatedUser.password,
      );
      expect(isPasswordMatch).toBe(true);
    });

    it('should throw ForbiddenException when non-admin tries to change roles', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const nonAdminUser = {...user, roles: [UserRole.USER]} as User;
      const updateUserDto: UpdateUserDto = {roles: [UserRole.ADMIN]};

      await expect(
        userService.updateUser(user.id, updateUserDto, nonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update roles when current user is admin', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      const adminUser = {...user, roles: [UserRole.ADMIN]} as User;
      const updateUserDto: UpdateUserDto = {
        roles: [UserRole.ADMIN, UserRole.USER],
      };

      const updatedUser = await userService.updateUser(
        user.id,
        updateUserDto,
        adminUser,
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.roles).toEqual([UserRole.ADMIN, UserRole.USER]);
    });

    it('should update email when current user is admin and email is not registered', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User', [
        UserRole.ADMIN,
      ]);
      const updateUserDto: UpdateUserDto = {email: 'newemail@example.com'};

      const updatedUser = await userService.updateUser(
        user.id,
        updateUserDto,
        user,
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.email).toBe('newemail@example.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const user = await createTestUser('testUser@example.com', 'Test User');
      await userService.deleteUser(user.id);

      const foundUser = await userRepository.findOneBy({id: user.id});
      expect(foundUser).toBeNull();
    });
  });

  describe('findByUserForTwoFactorEnabled', () => {
    it('should return user for two-factor authentication by ID', async () => {
      const user = await createTestUser(
        'twofactor@example.com',
        'Two Factor User',
      );
      const result = await userService.findByUserForTwoFactorEnabled(user.id);

      expect(result).toBeDefined();
      expect(result.email).toBe('twofactor@example.com');
    });

    it('should return null if user is not found', async () => {
      const result = await userService.findByUserForTwoFactorEnabled(999);

      expect(result).toBeNull();
    });
  });
});
