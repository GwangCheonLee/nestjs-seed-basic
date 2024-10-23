import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {User} from '../entities/user.entity';
import {UserRole} from '../enum/user-role.enum';
import RequestWithUserInterface from '../../common/interfaces/request-with-user.interface';

@Injectable()
/**
 * VerifyUserOwnershipGuard는 요청 경로 파라미터에 포함된 유저 ID를 확인하고,
 * 인증된 유저가 해당 유저 또는 어드민인지 확인하는 가드입니다.
 */
export class VerifyUserOwnershipGuard implements CanActivate {
  /**
   * 경로 파라미터에서 유저 ID를 추출하고, 인증된 유저의 권한을 확인하여 접근을 허용하는 메서드입니다.
   * @param {ExecutionContext} context - 요청의 실행 컨텍스트, HTTP 요청 객체를 가져오는 데 사용됩니다.
   * @return {Promise<boolean>} - 검증 성공 시 true 반환, 실패 시 예외 발생.
   * @throws {BadRequestException} - 경로 파라미터에 유저 ID가 없을 경우 발생.
   * @throws {ForbiddenException} - 접근 권한이 없을 경우 발생.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithUserInterface = context
      .switchToHttp()
      .getRequest<RequestWithUserInterface>();
    const requestUser: User = request.user;

    // 경로에서 유저 ID 추출
    const userIdFromParams: string = request.params.id;
    if (!userIdFromParams) {
      throw new BadRequestException(
        'User ID is required in the route parameters.',
      );
    }

    // 어드민이거나 자신의 정보에 접근할 경우만 허용
    if (
      !requestUser.roles.includes(UserRole.ADMIN) &&
      requestUser.id !== +userIdFromParams
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this user.',
      );
    }

    return true;
  }
}
