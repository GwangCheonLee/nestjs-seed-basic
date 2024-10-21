import {User} from '../entities/user.entity';
import {UserWithoutPassword} from '../interfaces/user.interface';

/**
 * 유저 정보를 인증된 사용자 정보로 변환합니다.
 *
 * @param {User} user - 변환할 유저
 * @return {UserWithoutPassword} - 비밀번호가 제외된 유저 정보
 */
export const extractPayloadFromUser: (user: User) => UserWithoutPassword = (
  user: User,
): UserWithoutPassword => {
  return {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    roles: user.roles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
