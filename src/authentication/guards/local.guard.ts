import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {GuardEnum} from '../enum/guard.enum';

/**
 * 로컬 전략을 사용하는 인증 가드입니다.
 */
@Injectable()
export class LocalGuard extends AuthGuard(GuardEnum.LOCAL) {}
