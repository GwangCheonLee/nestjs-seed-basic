import {Injectable, NotFoundException} from '@nestjs/common';
import {UserRepository} from './repositories/user.repository';
import {
  PaginatedUsersInterface,
  UserWithoutPassword,
} from './interfaces/user.interface';
import {User} from './entities/user.entity';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserPaginatedDto} from './dto/user-paginated.dto';
import {extractPayloadFromUser} from './constants/user.constant';

/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스입니다.
 * @class UserService
 */
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 사용자 목록을 페이지네이션하여 반환합니다.
   * 비밀번호를 제외한 사용자 정보를 반환합니다.
   * @param {UserPaginatedDto} userPaginatedDto - 페이지네이션 요청 데이터
   * @return {Promise<PaginatedUsersInterface>} - 페이지네이션된 사용자 목록
   */
  async paginateUsers(
    userPaginatedDto: UserPaginatedDto,
  ): Promise<PaginatedUsersInterface> {
    const {page, limit, sort, sortBy} = userPaginatedDto;

    const [users, totalEntry] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sort,
      },
    });

    const usersWithoutPassword: UserWithoutPassword[] = users.map(
      (user: User): UserWithoutPassword => extractPayloadFromUser(user),
    );

    return {
      users: usersWithoutPassword,
      pagination: {
        totalEntry,
        page,
        limit,
      },
    };
  }

  /**
   * 주어진 ID로 사용자를 조회합니다.
   * @param {number} id - 조회할 사용자 ID
   * @return {Promise<User>} - 조회된 사용자
   */
  async getUserById(id: number): Promise<User> {
    return this.userRepository.findUserById(id);
  }

  /**
   * 사용자를 수정합니다.
   * @param {number} id - 수정할 사용자 ID
   * @param {UpdateUserDto} updateUserDto - 수정할 데이터
   * @return {Promise<User>} - 수정된 사용자
   */
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);

    return extractPayloadFromUser(savedUser);
  }

  /**
   * 사용자를 삭제합니다.
   * @param {number} id - 삭제할 사용자 ID
   * @return {Promise<void>} - 삭제 완료
   */
  async deleteUser(id: number): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.userRepository.remove(user);
  }
}
