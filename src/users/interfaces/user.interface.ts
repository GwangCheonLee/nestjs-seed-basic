import {UserWithoutPassword} from '../types/user.type';

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
