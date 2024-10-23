import {CanActivate, ExecutionContext, mixin, Type} from '@nestjs/common';
import {UserRole} from '../../users/enum/user-role.enum';
import {User} from '../../users/entities/user.entity';
import RequestWithUser from '../../common/interfaces/request-with-user.interface';

/**
 * UserRoleGuard는 사용자가 특정 권한을 가지고 있는지 확인하는 가드입니다.
 *
 * @param {UserRole[]} roles - 허용된 사용자 역할 목록
 * @return {Type<CanActivate>} - 권한을 확인하는 가드 클래스
 */
const UserRoleGuard = (roles: UserRole[]): Type<CanActivate> => {
  class UserRoleGuardMixin implements CanActivate {
    /**
     * 사용자의 역할이 허용된 역할 목록에 있는지 확인합니다.
     *
     * @param {ExecutionContext} context - 요청의 실행 컨텍스트
     * @return {boolean} - 사용자가 허용된 역할을 가지고 있는지 여부
     */
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user: User = request.user;

      // 사용자의 역할이 허용된 역할 목록에 있는지 확인
      return roles.some((role) => user?.roles.includes(role));
    }
  }

  return mixin(UserRoleGuardMixin);
};

export default UserRoleGuard;
