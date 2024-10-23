import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {User} from '../entities/user.entity';
import RequestWithUser from '../../common/interfaces/request-with-user.interface';

/**
 * 사용자 정보를 요청에서 가져오는 커스텀 데코레이터
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
