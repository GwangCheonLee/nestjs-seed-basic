import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {UserService} from './user.service';
import {User} from './entities/user.entity';
import {
  PaginatedUsersInterface,
  UserWithoutPassword,
} from './interfaces/user.interface';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserPaginatedDto} from './dto/user-paginated.dto';
import {UserRole} from './enum/user-role.enum';
import {UserRoles} from '../authentication/decorators/user-roles.decorator';
import {JwtAccessGuard} from '../authentication/guards/jwt-access.guard';
import {UserRoleGuard} from '../authentication/guards/user-role.guard';

/**
 * 사용자 관련 요청을 처리하는 컨트롤러입니다.
 * @class UserController
 */
@UseGuards(JwtAccessGuard, UserRoleGuard)
@UserRoles(UserRole.ADMIN)
@Controller({version: '1', path: 'users'})
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 모든 사용자 목록을 페이지네이션하여 반환합니다.
   * @param {UserPaginatedDto} userPaginatedDto - 페이지네이션 요청 데이터
   * @return {Promise<PaginatedUsersInterface>} - 페이지네이션된 사용자 목록
   */
  @Get()
  async getUsers(
    @Query() userPaginatedDto: UserPaginatedDto,
  ): Promise<PaginatedUsersInterface> {
    return this.userService.paginateUsers(userPaginatedDto);
  }

  /**
   * 단일 사용자를 ID로 조회합니다.
   * @param {number} id - 조회할 사용자의 ID
   * @return {Promise<User>} - 조회된 사용자
   */
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /**
   * 사용자를 수정합니다.
   * @param {number} id - 수정할 사용자의 ID
   * @param {UpdateUserDto} updateUserDto - 수정할 데이터
   * @return {Promise<User>} - 수정된 사용자
   */
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    return this.userService.updateUser(id, updateUserDto);
  }

  /**
   * 사용자를 삭제합니다.
   * @param {number} id - 삭제할 사용자의 ID
   * @return {Promise<void>} - 삭제 완료
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
