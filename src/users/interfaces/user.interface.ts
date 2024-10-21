import {UserRole} from '../enum/user-role.enum';

/**
 * 페이지네이션 정보를 포함한 사용자 목록을 반환하는 인터페이스입니다.
 * @interface PaginatedUsersInterface
 */
export interface PaginatedUsersInterface {
  users: UserWithoutPassword[];
  pagination: {
    totalEntry: number;
    page: number;
    limit: number;
  };
}

/**
 * 비밀번호를 제외한 사용자 정보를 나타내는 인터페이스입니다.
 */
export interface UserWithoutPassword {
  id: number;
  email: string;
  nickname: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}
