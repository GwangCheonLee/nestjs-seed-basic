import {Test, TestingModule} from '@nestjs/testing';
import {DataSource} from 'typeorm';
import {UserService} from './user.service';
import {UserRepository} from './repositories/user.repository';
import {User} from './entities/user.entity';
import {TypeOrmModule} from '@nestjs/typeorm';
import {setupDataSource} from '../../jest/setup';
import {UserRole} from './enum/user-role.enum';
import {UserPaginatedDto} from './dto/user-paginated.dto';

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

  // eslint-disable-next-line require-jsdoc
  const createTestUser = async (email: string, nickname: string) => {
    return await userRepository.save({
      email,
      password: 'password',
      nickname,
      roles: [UserRole.USER],
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
});
