import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {GuardEnum} from '../enum/guard.enum';

/**
 * JWT Access Token을 사용하는 인증 가드입니다.
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard(GuardEnum.JWT_ACCESS) {}
